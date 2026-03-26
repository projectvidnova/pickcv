"""Discovery helpers for seeding and internet-scale company source ingestion."""
from __future__ import annotations

import gzip
import io
import re
import xml.etree.ElementTree as ET
from collections import OrderedDict
from urllib.parse import unquote, urlparse

import requests


class JobDiscoveryService:
    USER_AGENT = (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
    )
    NAUKRI_SITEMAP_INDEX_URL = "https://www.naukri.com/sitemap/sitemap.xml"
    NAUKRI_COMPANY_SITEMAP_MATCHERS = ("/sitemap/company-pages.xml", "jobByCompany-", "jobByPSUCompany")
    INDIA_COMPANY_CANDIDATES = [
        {"company_name": "Atlassian", "base_url": "https://www.atlassian.com/company/careers", "source_name": "custom"},
        {"company_name": "Infosys", "base_url": "https://career.infosys.com", "source_name": "custom"},
        {"company_name": "Meesho", "base_url": "https://careers.meesho.com", "source_name": "custom"},
        {"company_name": "PhonePe", "base_url": "https://www.phonepe.com/careers", "source_name": "custom"},
        {"company_name": "Zoho", "base_url": "https://www.zoho.com/careers", "source_name": "custom"},
        {"company_name": "Stripe", "base_url": "https://boards.greenhouse.io/stripe", "source_name": "greenhouse"},
        {"company_name": "Robinhood", "base_url": "https://boards.greenhouse.io/robinhood", "source_name": "greenhouse"},
    ]

    def detect_ats_type(self, url: str) -> str:
        host = (urlparse(url).netloc or "").lower()
        full = url.lower()
        if "lever.co" in host or "api.lever.co" in host:
            return "lever"
        if "greenhouse" in host or "boards-api.greenhouse.io" in full:
            return "greenhouse"
        if "workday" in host:
            return "workday"
        if "smartrecruiters" in host:
            return "smartrecruiters"
        return "custom"

    def _extract_loc_urls_from_xml(self, xml_text: str) -> list[str]:
        try:
            root = ET.fromstring(xml_text.encode("utf-8"))
        except Exception:
            return []
        urls: list[str] = []
        for element in root.iter():
            tag_name = element.tag.split("}")[-1].lower() if isinstance(element.tag, str) else ""
            if tag_name == "loc" and element.text:
                loc = element.text.strip()
                if loc:
                    urls.append(loc)
        return urls

    def _download_text(self, url: str, timeout: int = 25) -> str:
        headers = {"User-Agent": self.USER_AGENT, "Accept": "application/xml,text/xml,*/*"}
        response = requests.get(url, timeout=timeout, headers=headers)
        response.raise_for_status()
        if url.lower().endswith(".gz"):
            with gzip.GzipFile(fileobj=io.BytesIO(response.content)) as gz:
                return gz.read().decode("utf-8", errors="ignore")
        return response.text or ""

    def _slug_to_company_name(self, slug: str) -> str:
        cleaned = unquote(slug or "")
        cleaned = re.sub(r"-jobs?-careers?-\d+$", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"-careers?-\d+$", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"-jobs?-\d+$", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"-\d+$", "", cleaned)
        cleaned = re.sub(r"[-_]+", " ", cleaned)
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        return cleaned.title() if cleaned else "Unknown Company"

    def get_naukri_company_page_candidates(self, *, limit: int = 5000, max_sitemap_files: int = 8) -> list[dict]:
        if limit <= 0:
            return []
        index_xml = self._download_text(self.NAUKRI_SITEMAP_INDEX_URL)
        level_1 = self._extract_loc_urls_from_xml(index_xml)
        company_indexes = [url for url in level_1 if any(marker in url for marker in self.NAUKRI_COMPANY_SITEMAP_MATCHERS)]
        sitemap_urls: list[str] = []
        for index_url in company_indexes:
            if len(sitemap_urls) >= max_sitemap_files:
                break
            if index_url.lower().endswith(".xml.gz"):
                sitemap_urls.append(index_url)
                continue
            xml_text = self._download_text(index_url)
            child_urls = self._extract_loc_urls_from_xml(xml_text)
            for child_url in child_urls:
                if len(sitemap_urls) >= max_sitemap_files:
                    break
                if child_url.lower().endswith(".xml") or child_url.lower().endswith(".xml.gz"):
                    sitemap_urls.append(child_url)

        discovered: OrderedDict[str, dict] = OrderedDict()
        for sitemap_url in sitemap_urls:
            if len(discovered) >= limit:
                break
            xml_text = self._download_text(sitemap_url)
            for company_url in self._extract_loc_urls_from_xml(xml_text):
                if len(discovered) >= limit:
                    break
                slug = (urlparse(company_url).path or "").strip("/").split("/")[-1]
                discovered[company_url] = {
                    "company_name": self._slug_to_company_name(slug),
                    "base_url": company_url,
                    "source_name": "naukri_marketplace",
                    "ats_type": self.detect_ats_type(company_url),
                    "country": "IN",
                }
        return list(discovered.values())

    def get_india_hiring_company_candidates(self) -> list[dict]:
        results: list[dict] = []
        for item in self.INDIA_COMPANY_CANDIDATES:
            results.append(
                {
                    "company_name": item["company_name"],
                    "base_url": item["base_url"],
                    "source_name": item["source_name"],
                    "ats_type": self.detect_ats_type(item["base_url"]),
                    "country": "IN",
                }
            )
        return results


job_discovery_service = JobDiscoveryService()
