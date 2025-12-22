import { linter, Diagnostic } from "@codemirror/lint";


/*
 "java.util.List",
    "java.util.Map",
    "java.util.Set",
    "java.io.File",
    "java.io.IOException",
    "java.util.ArrayList",
    "java.util.HashMap",
    "java.util.HashSet",
    "java.util.Vector",
    "java.util.Queue",
    "java.util.Deque",
    "java.util.LinkedList",
    "java.util.TreeMap",
    "java.util.TreeSet",
    "java.util.PriorityQueue",
    "java.util.Collections",
    "java.util.Arrays",
    "java.util.Date",
    "java.util.Calendar",
    "java.util.Random",
    "java.util.regex.Pattern",
    "java.util.regex.Matcher",
    "java.io.BufferedReader",
    "java.io.InputStreamReader",
    "java.io.FileReader",
    "java.io.FileWriter",
    "java.io.PrintWriter",
    "java.io.BufferedWriter",
    "java.io.PrintStream",
    "java.nio.file.Files",
    "java.nio.file.Paths",
    "java.nio.file.Path",
    "java.math.BigInteger",
    "java.math.BigDecimal",
    "java.time.LocalDate",
    "java.time.LocalTime",
    "java.time.LocalDateTime",
    "java.time.format.DateTimeFormatter",
    "java.net.URL",
    "java.net.HttpURLConnection",
    "java.sql.Connection",
    "java.sql.DriverManager",
    "java.sql.ResultSet",
    "java.sql.Statement",
    "java.text.SimpleDateFormat",
    "java.awt.List",
    "java.awt.Map",
    "java.awt.Set", 
    "io.falconFlow.*"
*/


const allowedImports:any = [
   
];

function javaLinter(view: any) {
    let diagnostics: Diagnostic[] = [];
    let text = view.state.doc.toString();

    // Check for unclosed brackets in the whole document
    const bracketPairs: [string, string][] = [["(", ")"], ["{", "}"], ["[", "]"]];
    bracketPairs.forEach(([open, close]) => {
        let openCount = 0;
        let closeCount = 0;
        for (let char of text) {
            if (char === open) openCount++;
            if (char === close) closeCount++;
        }
        if (openCount > closeCount) {
            diagnostics.push({
                from: 0,
                to: text.length,
                severity: "error",
                message: `Unclosed bracket: expected '${close}' for '${open}'`,
            });
        }
    });

    text.split("\n").forEach((line: string, i: number) => {
        const trimmed = line.trim();

        // Ignore comments
        if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*") || trimmed.startsWith("*/")) {
            return;
        }

        // Spring Boot: Check for missing @SpringBootApplication annotation in main class
        if (
            trimmed.startsWith("public class") &&
            text.includes("SpringApplication.run")
        ) {
            // Do not warn if @SpringBootApplication is missing, as it's a correct statement for Spring Boot
            // So, skip this check
        }

        // Spring Boot: Warn if @RestController is used but no @RequestMapping/@GetMapping/@PostMapping found
        if (
            trimmed.includes("@RestController") &&
            !text.match(/@(RequestMapping|GetMapping|PostMapping|PutMapping|DeleteMapping)/)
        ) {
            diagnostics.push({
                from: view.state.doc.line(i + 1).from,
                to: view.state.doc.line(i + 1).to,
                severity: "warning",
                message: "No mapping annotation (@RequestMapping, @GetMapping, etc.) found in @RestController",
            });
        }

        // Spring Boot: Warn if @Autowired is used on fields that are not private
        if (
            trimmed.includes("@Autowired") &&
            !trimmed.startsWith("private")
        ) {
            diagnostics.push({
                from: view.state.doc.line(i + 1).from,
                to: view.state.doc.line(i + 1).to,
                severity: "info",
                message: "@Autowired field should be private",
            });
        }

        // Check for improperly written function signatures
        if (
            /(?:public|private|protected)?\s*(?:static\s+)?(?:[\w\<\>\[\]]+\s+)+(\w+)\s*\([^\)]*\)\s*\{/.test(trimmed)
        ) {
            // Check for invalid parameter list (missing type or name)
            const paramMatch = trimmed.match(/\(([^)]*)\)/);
            if (paramMatch) {
                const params = paramMatch[1].split(",").map(p => p.trim()).filter(p => p.length > 0);
                for (const param of params) {
                    // If parameter does not contain a space (type and name), it's invalid
                    if (!/^\w+\s+\w+$/.test(param)) {
                        diagnostics.push({
                            from: view.state.doc.line(i + 1).from,
                            to: view.state.doc.line(i + 1).to,
                            severity: "error",
                            message: "Function parameter is not properly written (missing type or name)",
                        });
                        break;
                    }
                }
            }
        }

        // Check for function definitions missing a return statement
        if (
            /(?:public|private|protected)?\s*(?:static\s+)?(?:[\w\<\>\[\]]+\s+)+(\w+)\s*\([^\)]*\)\s*\{/.test(trimmed) &&
            !/void\s+\w+\s*\(/.test(trimmed) // skip void functions
        ) {
            // Skip constructor definitions (no return type, name matches class name)
            const classNameMatch = text.match(/public\s+class\s+(\w+)/);
            const className = classNameMatch ? classNameMatch[1] : null;
            const funcNameMatch = trimmed.match(/(?:public|private|protected)?\s*(?:static\s+)?(?:[\w\<\>\[\]]+\s+)+(\w+)\s*\(/);
            const funcName = funcNameMatch ? funcNameMatch[1] : null;
            if (className && funcName === className) {
                // It's a constructor, skip return check
            } else {
                // Find function block
                let functionStart = i;
                let braceCount = 0;
                let foundReturn = false;
                for (let j = i; j < text.split("\n").length; j++) {
                    const funcLine = text.split("\n")[j];
                    braceCount += (funcLine.match(/{/g) || []).length;
                    braceCount -= (funcLine.match(/}/g) || []).length;
                    if (funcLine.includes("return ")) {
                        foundReturn = true;
                    }
                    if (braceCount === 0 && j !== i) {
                        if (!foundReturn) {
                            diagnostics.push({
                                from: view.state.doc.line(functionStart + 1).from,
                                to: view.state.doc.line(j + 1).to,
                                severity: "error",
                                message: "Missing return statement in non-void function",
                            });
                        }
                        break;
                    }
                }
            }
        }

        // Missing semicolon for likely statement lines (not blocks, signatures, or empty lines)
        if (
            trimmed &&
            !trimmed.endsWith(";") &&
            !trimmed.endsWith("{") &&
            !trimmed.endsWith("}") &&       
            !trimmed.startsWith("class") &&
            // Allow constructor signatures (e.g., public FuncCallBRE2_old(){})
            !/^(public|private|protected)?\s*\w+\s*\([^)]*\)\s*\{?$/.test(trimmed) &&
            !trimmed.startsWith("public") &&
            !trimmed.startsWith("private") &&
            !trimmed.startsWith("protected") &&
            !trimmed.startsWith("if") &&
            !trimmed.startsWith("else") &&
            !trimmed.startsWith("for") &&
            !trimmed.startsWith("while") &&
            !trimmed.startsWith("switch") &&
            // Allow annotation + field declaration (e.g., @Autowired private DatabaseContext ...)
            !/^@\w+\s+(public|private|protected)?\s*\w+/.test(trimmed) &&
            !trimmed.startsWith("}") &&
            !trimmed.startsWith("{") &&
            !trimmed.endsWith(":") && // labels
            trimmed !== ""
        ) {
            // Only warn if the line contains an assignment or method call
            if (/[=()]/.test(trimmed)) {
                diagnostics.push({
                    from: view.state.doc.line(i + 1).from,
                    to: view.state.doc.line(i + 1).to,
                    severity: "warning",
                    message: "Missing semicolon",
                });
            }
        }

        // Unused import, but allow some imports from allowedImports
        if (trimmed.startsWith("import") && trimmed.endsWith(";")) {
            const importNameMatch = trimmed.match(/import\s+([\w\.]+);/);
            if (importNameMatch) {
                const fullImportName = importNameMatch[1];
                const importName = fullImportName.split(".").pop();
                // Only check unused if not in allowedImports
                if (!allowedImports.includes(fullImportName)) {
                    // Check for usage as type, variable, or method call
                    const importUsedRegex = new RegExp(`\\b${importName}\\b`);
                    if (importName && !importUsedRegex.test(text)) {
                        diagnostics.push({
                            from: view.state.doc.line(i + 1).from,
                            to: view.state.doc.line(i + 1).to,
                            severity: "info",
                            message: `Unused import: ${importName}`,
                        });
                    }
                }
            }
        }

        // TODO comment
        if (trimmed.includes("TODO")) {
            diagnostics.push({
                from: view.state.doc.line(i + 1).from + trimmed.indexOf("TODO"),
                to: view.state.doc.line(i + 1).from + trimmed.indexOf("TODO") + 4,
                severity: "info",
                message: "TODO found",
            });
        }

        // Deprecated method usage (example: Thread.stop)
        if (trimmed.includes("Thread.stop")) {
            diagnostics.push({
                from: view.state.doc.line(i + 1).from + trimmed.indexOf("Thread.stop"),
                to: view.state.doc.line(i + 1).from + trimmed.indexOf("Thread.stop") + "Thread.stop".length,
                severity: "warning",
                message: "Deprecated method 'Thread.stop' used",
            });
        }
    });

    return diagnostics;
}

export const javaLint = linter(javaLinter);