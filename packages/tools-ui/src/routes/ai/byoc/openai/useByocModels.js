import { useEffect } from "react";
import { useObservable } from "rxjs-hooks";
import { $supportedModels } from "../../../../api/DataService.js";

export function useByocModels(pipeline, setForm) {
    const models = useObservable(() => $supportedModels(pipeline), []);

    useEffect(() => {
        if (models.length > 0) {
            setForm((prev) => prev.model ? prev : { ...prev, model: models[0] });
        }
    }, [models]);

    return models;
}
