"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YoutubeExtractor = void 0;
const _base_1 = require("./_base");
class YoutubeExtractor extends _base_1.BaseExtractor {
    constructor(document, url, schemaOrgData) {
        super(document, url, schemaOrgData);
        this.videoElement = document.querySelector('video');
        this.schemaOrgData = schemaOrgData;
    }
    canExtract() {
        return true;
    }
    extract() {
        const videoData = this.getVideoData();
        const description = videoData.description || '';
        const formattedDescription = this.formatDescription(description);
        const contentHtml = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${this.getVideoId()}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe><br>${formattedDescription}`;
        return {
            content: contentHtml,
            contentHtml: contentHtml,
            extractedContent: {
                videoId: this.getVideoId(),
                author: videoData.author || '',
            },
            variables: {
                title: videoData.name || '',
                author: videoData.author || '',
                site: 'YouTube',
                image: Array.isArray(videoData.thumbnailUrl) ? videoData.thumbnailUrl[0] || '' : '',
                published: videoData.uploadDate,
                description: description.slice(0, 200).trim(),
            }
        };
    }
    formatDescription(description) {
        return `<p>${description.replace(/\n/g, '<br>')}</p>`;
    }
    getVideoData() {
        if (!this.schemaOrgData)
            return {};
        const videoData = Array.isArray(this.schemaOrgData)
            ? this.schemaOrgData.find(item => item['@type'] === 'VideoObject')
            : this.schemaOrgData['@type'] === 'VideoObject' ? this.schemaOrgData : null;
        return videoData || {};
    }
    getVideoId() {
        const url = new URL(this.url);
        if (url.hostname === 'youtu.be') {
            return url.pathname.slice(1);
        }
        return new URLSearchParams(url.search).get('v') || '';
    }
}
exports.YoutubeExtractor = YoutubeExtractor;
//# sourceMappingURL=youtube.js.map