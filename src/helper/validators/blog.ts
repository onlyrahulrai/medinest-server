import { validateString } from "./common";

export const validateManageBlog = (values: any) => {
    let errors: Record<string, string> = {};

    validateString(errors, values, "title", { required: true });
    validateString(errors, values, "slug", { required: true });
    validateString(errors, values, "excerpt", { required: true });
    validateString(errors, values, "content", { required: true });
    validateString(errors, values, "coverImage", { required: true });
    validateString(errors, values, "category", { required: true });

    // Optional: readTime (if you want)
    validateString(errors, values, "readTime", { required: false });

    // 🔹 Tags validation
    if (values.tags && !Array.isArray(values.tags)) {
        errors.tags = "Tags must be an array";
    }

    // 🔹 Published validation
    if (values.published !== undefined && typeof values.published !== "boolean") {
        errors.published = "Published must be a boolean";
    }

    return errors;
};