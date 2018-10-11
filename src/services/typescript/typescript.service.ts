import { readFile } from 'fs-extra';
const readDir = require('fs-readdir-recursive');
const stripIndent = require('strip-indent');

import { IInterfaceParsed, IMethod, IProperty, IMethodParsed, IPropertyParsed } from './typescript.type';

export async function getInterfaces(path: string): Promise<{[name: string]: string}> {
    // read all typed files
    let filesContent: string[] = [];
    const files = readDir(path);
    for (let i = 0; i < files.length; i++) {
        const filePath: string = `${path}/${files[i]}`;
        const content: string = await readFile(filePath, 'utf-8');
        filesContent.push(content);
    }

    // all content
    let text: string = filesContent.join('\r\n');
    text = text.replace(/import\ [^\n]*/g, '')
                .replace(/export\ /g, '')
                .replace(/\/\/[^\n]*/g, '')
                .replace(/\/\*(.*)\*\//g, '');

    // interfaces
    let interfaces: any = {};
    const interfaceSplits = text.split('interface');
    for (let i = 0; i < interfaceSplits.length; i++) {
        const block = interfaceSplits[i].trim();
        const interfaceName: string = block.split('{')[0].trim();
        let interfaceContent: string = block.substring(
            block.indexOf('{') + 1,
            block.lastIndexOf('}')
        ).trim();

        // return
        interfaces[interfaceName] = interfaceContent;
    }
    return interfaces;
}

export async function parseInterfaces(path: string): Promise<{[key: string]: IInterfaceParsed}> {
    // get interfaces
    const interfaces = await getInterfaces(path);
    // parse
    let parsedInterfaces: any = {};
    for (const key of Object.keys(interfaces)) {
        const interfaceContent = interfaces[key];
        // properties and methods
        let properties: IProperty[] = [];
        let methods: IMethod[] = [];
        (interfaceContent.split(';')).forEach(item => {
            if (item) {
                item = stripIndent(item.replace(/\r|\n|\t/g, ''));
                if (item.indexOf('(') > -1 && item.indexOf(')') > -1) {
                    // methods
                    methods.push(parseMethod(item));
                } else {
                    // properties
                    properties.push(parseProperty(item));
                }
            }
        });
        // return
        parsedInterfaces[key] = {
            raw: interfaceContent,
            properties,
            methods
        };
    }
    return parsedInterfaces;
}

function parseMethod(methodString: string): IMethod {
    let parsedMethod: IMethodParsed = { name: null };
    const methodStringSplit = methodString.split(':');

    // name
    let [ methodName ] = methodString.split('(');
    if (methodName.indexOf('?') > -1) {
        // is optional
        parsedMethod.optional = true;
        methodName = methodName.replace('?', '').trim();
    }
    if (/\<(.*)\>/.test(methodName)) {
        let typeParams = methodName.substring(
            methodName.indexOf('<') + 1,
            methodName.lastIndexOf('>')
        ).trim();
        parsedMethod.typeParams = typeParams.split(',')
                                    .map(x => x.trim());
        methodName = methodName.replace(/\<(.*)\>/g, '').trim();
    }
    parsedMethod.name = methodName;

    // return type
    let returnType: string = methodStringSplit.pop().trim();
    if (returnType && returnType.indexOf(')') < 0 && returnType.indexOf('}') < 0) {
        parsedMethod.returnType = returnType;
    }

    // params
    let params: IPropertyParsed[] = [];
    const paramsString: string = methodString.substring(
        methodString.indexOf('(') + 1,
        methodString.lastIndexOf(')')
    ).trim();

    (<string[]> paramsString.split(',')).forEach(paramString => {
        let param: IPropertyParsed = { name: null };
        const paramSplit = paramString.trim().split(':');
        // name
        let [ paramName ] = paramSplit;
        if (paramName.indexOf('?') > -1) {
            // is optional
            param.optional = true;
            paramName = paramName.replace('?', '').trim();
        }
        param.name = paramName;
        // type
        const paramType = paramSplit.pop().trim();
        if (paramType) {
            param.type = paramType;
        }
        params.push(param);
    });
    if (params.length > 0) {
        parsedMethod.params = params;
    }

    // formated
    const formatedMethod = formatMethod(parsedMethod);

    // return
    return {
        raw: methodString,
        parsed: parsedMethod,
        formated: formatedMethod
    };
}

function parseProperty(propertyString: string): IProperty {
    let propertyParsed: IPropertyParsed = { name: null };
    const propertyStringSplit = propertyString.split(':');

    // name     
    let [ propName ] = propertyStringSplit;    
    if (propName.indexOf('?') > -1) {
        // is optional
        propertyParsed.optional = true;
        propName = propName.replace('?', '').trim();
    }
    propertyParsed.name = propName;

    // type
    let type: string = propertyString.substring(
        propertyString.indexOf('{') + 1,
        propertyString.lastIndexOf('}')
    ).trim();
    if (type) {
        type = '{' + type + '}';
    } else {
        type = propertyStringSplit.pop().trim();    
        if (type.indexOf(')') > -1) {
            type = null;
        }
    }
    if (type) {
        propertyParsed.type = type;
    }

    // formated
    const formatedProperty = formatProperty(propertyParsed);

    // return
    return {
        raw: propertyString,
        parsed: propertyParsed,
        formated: formatedProperty
    };
}

function formatMethod(parsedMethod: IMethodParsed): string {
    // TODO: TODO
    return JSON.stringify(parsedMethod);
}

function formatProperty(parsedProperty: IPropertyParsed): string {
    // TODO: TODO
    return JSON.stringify(parsedProperty);
}