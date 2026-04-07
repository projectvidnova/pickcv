import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "node:path";
import AutoImport from "unplugin-auto-import/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base = env.BASE_PATH || "/";
  const isPreview = env.IS_PREVIEW ? true : false;
  const backendProxyTarget = env.VITE_BACKEND_PROXY_TARGET || "http://localhost:8000";
  const hasExplicitApiUrl = Boolean(env.VITE_API_URL && env.VITE_API_URL.trim());

  return {
    define: {
      __BASE_PATH__: JSON.stringify(base),
      __IS_PREVIEW__: JSON.stringify(isPreview),
      __READDY_PROJECT_ID__: JSON.stringify(env.PROJECT_ID || ""),
      __READDY_VERSION_ID__: JSON.stringify(env.VERSION_ID || ""),
      __READDY_AI_DOMAIN__: JSON.stringify(env.READDY_AI_DOMAIN || ""),
    },
    plugins: [
      react(),
      AutoImport({
        imports: [
          {
            react: [
              "React",
              "useState",
              "useEffect",
              "useContext",
              "useReducer",
              "useCallback",
              "useMemo",
              "useRef",
              "useImperativeHandle",
              "useLayoutEffect",
              "useDebugValue",
              "useDeferredValue",
              "useId",
              "useInsertionEffect",
              "useSyncExternalStore",
              "useTransition",
              "startTransition",
              "lazy",
              "memo",
              "forwardRef",
              "createContext",
              "createElement",
              "cloneElement",
              "isValidElement",
            ],
          },
          {
            "react-router-dom": [
              "useNavigate",
              "useLocation",
              "useParams",
              "useSearchParams",
              "Link",
              "NavLink",
              "Navigate",
              "Outlet",
            ],
          },
          // React i18n
          {
            "react-i18next": ["useTranslation", "Trans"],
          },
        ],
        dts: true,
      }),
    ],
    base,
    build: {
      sourcemap: true,
      outDir: "out",
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 3000,
      host: "0.0.0.0",
      proxy: hasExplicitApiUrl
        ? undefined
        : {
            "/api": {
              target: backendProxyTarget,
              changeOrigin: true,
            },
          },
    },
  };
});
