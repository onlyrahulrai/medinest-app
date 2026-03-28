import axiosInstance from "./base";

export const uploadFile = (values: { type: "single" | "multiple"; file?: any; files?: any[] }) => {
    return new Promise(async (resolve, reject) => {
        console.log("uploading file", values);

        const formData = new FormData();

        if (values.type === "single" && values.file) {
            // For React Native, file needs to be an object: { uri, name, type }
            formData.append("file", values.file as any);
        }

        if (values.type === "multiple" && values.files) {
            values.files.forEach((f) => formData.append("files", f as any));
        }

            const URL =
                values.type === "multiple" ? "/upload/multiple" : "/upload/single";

            await axiosInstance
                .post(URL, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                })
                .then((response) => {
                    resolve(response);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    };
