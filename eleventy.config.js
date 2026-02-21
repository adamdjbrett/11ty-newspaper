import { IdAttributePlugin, InputPathToUrlTransformPlugin, HtmlBasePlugin } from "@11ty/eleventy";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import pluginSyntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import pluginNavigation from "@11ty/eleventy-navigation";
import yaml from "js-yaml";
import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";
import markdownItAttrs from 'markdown-it-attrs';
import markdownItFootnote from "markdown-it-footnote";
import pluginTOC from 'eleventy-plugin-toc';
import { execSync } from "child_process";
import pluginFilters from "./_config/filters.js";

/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
export default async function(eleventyConfig) {
	// Drafts, see also _data/eleventyDataSchema.js
	eleventyConfig.addPreprocessor("drafts", "*", (data, content) => {
		if (data.draft) {
			data.title = `${data.title} (draft)`;
		}

		if(data.draft && process.env.ELEVENTY_RUN_MODE === "build") {
			return false;
		}
	});
	eleventyConfig.addDataExtension("yaml", (contents) => yaml.load(contents));
	    eleventyConfig.addPlugin(pluginTOC, {
        tags: ['h2', 'h3', 'h4', 'h5'],
        id: 'toci', 
        class: 'toci',
        ul: true,
        flat: true,
        wrapper: 'div'
    });
    

    let mdOptions = {
        html: true,
        breaks: true,
        linkify: true,
        typographer: true,
    };

    const md = new markdownIt(mdOptions)
        .use(markdownItAnchor, { 
            permalink: markdownItAnchor.permalink.headerLink(),
            permalinkClass: "direct-link",
            permalinkSymbol: "#"
        })
        .use(markdownItAttrs)
        .use(markdownItFootnote);

    eleventyConfig.setLibrary("md", md);

    eleventyConfig.addFilter("md", function (content) {
        return md.render(content);
    });

eleventyConfig.on("eleventy.after", ({ dir }) => {
    console.log("🔍 Building Pagefind index...");
    execSync(`npx pagefind --site ${dir.output} --glob "**/*.html"`, {
        encoding: "utf-8", 
        stdio: "inherit"  
    });
});


    eleventyConfig.addPassthroughCopy({"./public/": "/"})
    eleventyConfig.addPassthroughCopy("./content/feed/pretty-atom-feed.xsl");
	eleventyConfig.addWatchTarget("css/**/*.css");

	eleventyConfig.addWatchTarget("content/**/*.{svg,webp,png,jpg,jpeg,gif}");
	eleventyConfig.addBundle("css", {
		toFileDirectory: "dist",
		bundleHtmlContentFromSelector: "style",
	});
	eleventyConfig.addBundle("js", {
		toFileDirectory: "dist",
		bundleHtmlContentFromSelector: "script",
	});
	eleventyConfig.addPlugin(pluginSyntaxHighlight, {
		preAttributes: { tabindex: 0 }
	});
	eleventyConfig.addPlugin(pluginNavigation);
	eleventyConfig.addPlugin(HtmlBasePlugin);
	eleventyConfig.addPlugin(InputPathToUrlTransformPlugin);
	eleventyConfig.on("eleventy.after", () => {
        execSync(`npx pagefind --site _site --glob \"**/*.html\"`, {
            encoding: "utf-8",
        });
    });
	

eleventyConfig.addFilter("getAuthorObj", (authorsCollection, authorKey) => {
        if (!authorKey || !authorsCollection) return null;
        return authorsCollection.find(author => {
            const key = author.data?.key || author.fileSlug;
            return key.toLowerCase() === String(authorKey).toLowerCase().trim();
        });
    });

    eleventyConfig.addFilter("getPostsByAuthor", (allPosts, authorKey) => {
        if (!allPosts || !authorKey) return [];
        const normalizedKey = String(authorKey).toLowerCase().trim();
        return allPosts.filter(post => {
            const authorField = post.data.author || post.data.authors;
            if (!authorField) return false;
            const postAuthors = Array.isArray(authorField) 
                ? authorField.map(a => String(a).toLowerCase().trim())
                : String(authorField).split(',').map(a => a.trim().toLowerCase());
            return postAuthors.includes(normalizedKey);
        });
    });
eleventyConfig.addCollection("authors", function(collectionApi) {
        return collectionApi.getFilteredByGlob("content/authors/*.md").sort((a, b) => {
            const nameA = (a.data.name || a.data.title || "").toLowerCase();
            const nameB = (b.data.name || b.data.title || "").toLowerCase();
            return nameA.localeCompare(nameB);
        });
    });

	eleventyConfig.addPlugin(feedPlugin, {
		type: "atom", // or "rss", "json"
		outputPath: "/feed/feed.xml",
		stylesheet: "pretty-atom-feed.xsl",
		templateData: {
			eleventyNavigation: {
				key: "Feed",
				order: 4
			}
		},
		collection: {
			name: "posts",
			limit: 10,
		},
		metadata: {
			language: "en",
			title: "Blog Title",
			subtitle: "This is a longer description about your blog.",
			base: "https://example.com/",
			author: {
				name: "Your Name"
			}
		}
	});

	eleventyConfig.addPlugin(pluginFilters);
	eleventyConfig.addPlugin(IdAttributePlugin, {
	});

	eleventyConfig.addShortcode("currentBuildDate", () => {
		return (new Date()).toISOString();
	});
};

export const config = {
	templateFormats: [
		"md",
		"njk",
		"html",
		"liquid",
		"11ty.js",
	],
	markdownTemplateEngine: "njk",
	htmlTemplateEngine: "njk",
	dir: {
		input: "content",          // default: "."
		includes: "../_includes",  // default: "_includes" (`input` relative)
		data: "../_data",          // default: "_data" (`input` relative)
		output: "_site"
	},
};
