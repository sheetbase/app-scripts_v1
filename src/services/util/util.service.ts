export function extractString(str: string, prefix: string, suffix: string, includePrefix: boolean = true, includeSuffix: boolean = true): string {
    try {
        let prefixIndex: number = str.indexOf(prefix);
        let suffixIndex: number = str.lastIndexOf(suffix);
        if (prefixIndex < 0 || suffixIndex < 0 || suffixIndex <= prefixIndex) {
            return '';
        }
        if (!includePrefix) {
            prefixIndex = prefixIndex + prefix.length;
        }
        if (includeSuffix) {
            suffixIndex = suffixIndex + suffix.length;
        }
        return str.substring(prefixIndex, suffixIndex);
    } catch (error) {
        return '';
    }
}