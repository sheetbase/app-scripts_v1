export interface IBuildCodeInput {
    src?: string;
    dist?: string;
    names?: {
        namePascalCase?: string;
        nameSnakeCase?: string;
        nameParamCase?: string;
        nameConstantCase?: string;
    };
    // options
    param?: string;
    type?: string; // --app (else = module)
    vendor?: boolean;
    bundle?: boolean;
    init?: boolean;
}