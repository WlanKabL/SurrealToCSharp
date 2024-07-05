const fs = require("fs");
const path = require("path");

// Dateipfad zur hochgeladenen Datei
const inputFilePath = "./crowd-nation-2024-07-05.surql"; // Ersetzen Sie dies durch den tatsächlichen Dateinamen
const outputDir =
    "C:/Users/phili/Desktop/Desktop/SuaJS/Githubs/CrowdNation.API/CrowdNation.API/Models/Database/";

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Lesen des Inhalts der Datei
const fileContent = fs.readFileSync(inputFilePath, "utf-8");

// Debug-Ausgabe, um sicherzustellen, dass der Dateinhalt korrekt gelesen wird
console.log("File Content:", fileContent.slice(0, 500)); // Ausgabe der ersten 500 Zeichen

// Anpassung des regulären Ausdrucks
const tableMatches = [
    ...fileContent.matchAll(
        /-- TABLE: (\w+)[\s\S]*?DEFINE TABLE \w+ TYPE \w+ SCHEMAFULL PERMISSIONS NONE;([\s\S]*?)(?=-- TABLE|\n\n--|-- TRANSACTION)/gi
    ),
];

// Debug-Ausgabe, um die extrahierten Tabellen und deren Eigenschaften zu überprüfen
console.log("Extracted Tables and Properties:", tableMatches.length);

const toPascalCase = (str) => {
    return str.replace(/(^\w|_\w)/g, clearAndUpper);
};

const clearAndUpper = (text) => {
    return text.replace(/_/, "").toUpperCase();
};

tableMatches.forEach((match) => {
    const tableName = match[1];
    const properties = [
        ...match[2].matchAll(/DEFINE FIELD (\w+) ON \w+ TYPE (\w+)/g),
    ];

    // Debug-Ausgabe, um die extrahierten Eigenschaften zu überprüfen
    console.log(`Table: ${tableName}`, "Properties:", properties);

    const className = `Db${toPascalCase(tableName.trim())}`;
    const fileName = `${className}.cs`;
    const filePath = path.join(outputDir, fileName);

    const classProperties = properties
        .map((prop) => {
            const [_, name, type] = prop;
            if (!name || !type) {
                console.log(`Skipping invalid property: ${prop}`);
                return "";
            }
            const pascalCaseName = toPascalCase(name);
            return `        public ${mapType(
                type
            )} ${pascalCaseName} { get; set; }`;
        })
        .filter(Boolean)
        .join("\n");

    const classContent = `using System;
using System.Collections.Generic;

namespace CrowdNation.API.Models.Database
{
    public class ${className}
    {
${classProperties}
    }
}`;

    fs.writeFileSync(filePath, classContent, "utf-8");
    console.log(`Created ${filePath}`);
});

console.log("All classes generated successfully!");

// Funktion zum Zuordnen der Typen von SQL zu C#
function mapType(sqlType) {
    switch (sqlType.toLowerCase()) {
        case "int":
        case "integer":
            return "int";
        case "float":
        case "double":
        case "decimal":
            return "double";
        case "string":
        case "text":
            return "string";
        case "bool":
        case "boolean":
            return "bool";
        case "date":
        case "datetime":
            return "DateTime";
        case "array":
            return "List<string>";
        default:
            return "string"; // Default Typ, falls unbekannt
    }
}
