export interface BuildCodeInput {
    src?: string;
    dist?: string;
    names?: {
        namePascalCase?: string;
        nameSnakeCase?: string;
        nameParamCase?: string;
        nameConstantCase?: string;
    };
    // options
    params?: string;
    type?: string; // --app (else = module)
    vendor?: boolean;
    bundle?: boolean;
    init?: boolean;
    copies?: string[];
}