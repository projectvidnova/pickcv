export function get_form_url(formName: string): string {
  const formUrls: Record<string, string> = {
    newsletter: 'https://form.readdy.ai/api/form-submit/placeholder',
    contact: 'https://form.readdy.ai/api/form-submit/placeholder',
  };
  return formUrls[formName] || 'https://form.readdy.ai/api/form-submit/placeholder';
}
