export interface IInterfaceParsed {
    raw: string;
    properties?: IProperty[];
    methods?: IMethod[];
}
export interface IPropertyParsed {
    name: string;
    type?: string;
    optional?: boolean;
}

export interface IProperty {
    raw: string;
    formated?: string;
    parsed?: IPropertyParsed;
}

export interface IMethodParsed {
    name: string;
    params?: IPropertyParsed[];
    typeParams?: string[];
    optional?: boolean;
    returnType?: string;
}

export interface IMethod {
    raw: string;
    formated?: string;
    parsed?: IMethodParsed;
}
