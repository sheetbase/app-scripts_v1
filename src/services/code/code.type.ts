export interface IBuildCodeInput {
    type?: string;
    src?: string;
    dist?: string;
    names?: {
        namePascalCase?: string;
        nameSnakeCase?: string;
        nameParamCase?: string;
        nameConstantCase?: string;
    };
    bundle?: boolean;
}