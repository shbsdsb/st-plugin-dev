export const name = 'st-ui-slots';
export const configSchema = {
    '~standard': {
        version: 1,
        vendor: 'st-ui-slots',
        validate: (value) => ({ value: value ?? { showCollapsedRail: true } }),
    },
};
export function apply(_ctx, _config) {
    // 无后端逻辑;前端布局经 st.client 声明由 web-module 加载
}
apply.Config = configSchema;
export default apply;
