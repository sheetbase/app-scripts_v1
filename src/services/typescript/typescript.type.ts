export interface InterfaceParsed {
    raw: string;
    properties?: Property[];
    methods?: Method[];
}
export interface PropertyParsed {
    name: string;
    type?: string;
    optional?: boolean;
}

export interface Property {
    raw: string;
    formated?: string;
    parsed?: PropertyParsed;
}

export interface MethodParsed {
    name: string;
    params?: PropertyParsed[];
    typeParams?: string[];
    optional?: boolean;
    returnType?: string;
}

export interface Method {
    raw: string;
    formated?: string;
    parsed?: MethodParsed;
}
