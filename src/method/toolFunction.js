export function getFileType(typeStr) {
	const type = typeStr.split('/')[0];
	if(type == 'video') {
		return 0;
	}
	if(type == 'audio') {
		return 1;
	}
	if(type == 'image') {
		return 2;
	}
}

export function safeB64Encode(str) {
	return btoa(str).replace(/\+/g, '-').replace(/\//g, '_');
}