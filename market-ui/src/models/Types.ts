export interface Metadata {
	name: string;
	description: string;
	display: Display;
	attributes: Attribute[];
}

export interface Display {
	url: string;
}

export interface Attribute {
	name: string;
	type: string;
	value: string;
}
