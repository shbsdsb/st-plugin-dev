// agent_plugin_dev/llm-plugin/src/ui/provider.ts
export const VENDOR_BASE_URLS = {
    openai: 'api.openai.com/v1',
    deepseek: 'api.deepseek.com/v1',
    zhipu: 'open.bigmodel.cn/api/paas/v4',
    qwen: 'dashscope.aliyuncs.com/compatible-mode/v1',
    anthropic: 'api.anthropic.com/v1',
    google: 'generativelanguage.googleapis.com/v1beta',
};
export const VENDOR_FORMATS = {
    openai: 'openai_compatible',
    deepseek: 'openai_compatible',
    zhipu: 'openai_compatible',
    qwen: 'openai_compatible',
    anthropic: 'anthropic',
    google: 'google',
};
export function computeAutoValues(vendor) {
    if (!vendor)
        return { baseUrl: '', format: '' };
    return { baseUrl: VENDOR_BASE_URLS[vendor] ?? '', format: VENDOR_FORMATS[vendor] ?? '' };
}
