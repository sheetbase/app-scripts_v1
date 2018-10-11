export interface INPMPackageDotJson {
    name?: string;
	version?: string;
	description?: string;
	author?: string;
	homepage?: string;
	license?: string;
	scripts?: {[key: string]: string};
	keywords?: string[];
	repository?: {
		type?: string;
		url?: string;
	};
	bugs?: {
		url?: string;
	};
	dependencies?: {[key: string]: string};
	devDependencies?: {[key: string]: string};
	peerDependencies?: {[key: string]: string};
}