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
    type?: string; // --app (else = module)
    vendor?: boolean;
    bundle?: boolean;
}