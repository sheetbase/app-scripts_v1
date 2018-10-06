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
    type?: string; // --app
    vendor?: boolean;
    bundle?: boolean;
    ugly?: boolean;
}