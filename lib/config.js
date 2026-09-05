export function normalizeConfig(config) {
    const c = (config && typeof config === 'object' ? config : {});
    const timeFormat = c.timeFormat === 'HH:mm:ss' ? 'HH:mm:ss' : 'HH:mm:ss.SSS';
    return {
        lifecycle: c.lifecycle !== false,
        service: c.service !== false,
        events: c.events !== false,
        file: c.file !== false,
        timeFormat,
    };
}
