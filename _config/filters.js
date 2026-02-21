import { DateTime } from "luxon";

export default function(eleventyConfig) {
    // --- DATE FILTERS ---
    eleventyConfig.addFilter("readableDate", (dateObj, format, zone) => {
        return DateTime.fromJSDate(dateObj, { zone: zone || "utc" }).toFormat(format || "dd LLLL yyyy");
    });

    eleventyConfig.addFilter("htmlDateString", (dateObj) => {
        return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat('yyyy-LL-dd');
    });

    // --- COLLECTION HELPERS ---
    eleventyConfig.addFilter("head", (array, n) => {
        if(!Array.isArray(array) || array.length === 0) return [];
        if( n < 0 ) return array.slice(n);
        return array.slice(0, n);
    });

    eleventyConfig.addFilter("min", (...numbers) => {
        return Math.min.apply(null, numbers);
    });

    eleventyConfig.addFilter("getKeys", target => {
        return Object.keys(target);
    });

    eleventyConfig.addFilter("filterTagList", function filterTagList(tags) {
        return (tags || []).filter(tag => ["all", "posts", "authors", "post"].indexOf(tag) === -1);
    });

    eleventyConfig.addFilter("sortAlphabetically", strings =>
        (strings || []).sort((b, a) => b.localeCompare(a))
    );

    // --- AUTHOR LOGIC FILTERS ---
    eleventyConfig.addFilter("authorsToArray", (value) => {
        if(!value) return [];
        if(Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
        if(typeof value === "string") {
            return value.split(",").map(s => s.trim()).filter(Boolean);
        }
        return [String(value).trim()];
    });

    // Helper internal untuk normalisasi array di dalam filter
    const toArray = (v) => {
        if(!v) return [];
        if(Array.isArray(v)) return v;
        if(typeof v === "string") {
            const parts = v.split(",").map(s => s.trim()).filter(Boolean);
            return parts.length ? parts : [v.trim()];
        }
        return [String(v)];
    };

    eleventyConfig.addFilter("authorsToLinks", (value, authorsCollection) => {
        const keys = toArray(value);
        const lookup = new Map();
        
        (authorsCollection || []).forEach(a => {
            const k = a.data?.key || a.page?.fileSlug || a.fileSlug;
            if(k) lookup.set(String(k), a);
        });

        const links = keys.map(k => {
            const key = String(k).trim();
            const match = lookup.get(key);
            if(match) {
                const display = match.data?.name || match.data?.title || key;
                const url = match.url || `/authors/${key}/`;
                return `<a href="${url}">${display}</a>`;
            }
            return key;
        });

        return links.join(", ");
    });

    eleventyConfig.addFilter("authorsToNames", (value, authorsCollection) => {
        const keys = toArray(value);
        const lookup = new Map();
        
        (authorsCollection || []).forEach(a => {
            const k = a.data?.key || a.page?.fileSlug || a.fileSlug;
            if(k) lookup.set(String(k), a);
        });

        const names = keys.map(k => {
            const key = String(k).trim();
            const match = lookup.get(key);
            if(match) {
                return match.data?.name || match.data?.title || key;
            }
            return key;
        });

        return names.join(", ");
    });
}