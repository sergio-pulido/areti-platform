import { runMigrations, seedLibraryAndPracticesContent } from "./client.js";

runMigrations();
seedLibraryAndPracticesContent();

// eslint-disable-next-line no-console
console.log("Library and practices seed completed.");
