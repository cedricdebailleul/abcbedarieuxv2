
import { z } from "zod";

const schema = z.string();
const result = schema.safeParse(123);

if (!result.success) {
    console.log("Keys of ZodError:", Object.keys(result.error));
    console.log("Proto keys:", Object.getOwnPropertyNames(Object.getPrototypeOf(result.error)));
    // Check if issues exists
    // @ts-ignore
    if (result.error.issues) {
        console.log("Has 'issues' property");
    }
    // Check if errors exists
    // @ts-ignore
    if (result.error.errors) {
        console.log("Has 'errors' property");
    }
}
