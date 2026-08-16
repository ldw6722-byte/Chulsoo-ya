package com.chulsooya.server;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

final class DotenvLoader {
    private DotenvLoader() {}

    static void load() {
        Path dotenv = Path.of(".env").toAbsolutePath().normalize();
        if (!Files.isRegularFile(dotenv)) dotenv = Path.of("server", ".env").toAbsolutePath().normalize();
        if (!Files.isRegularFile(dotenv)) return;
        try {
            for (String raw : Files.readAllLines(dotenv, StandardCharsets.UTF_8)) {
                String line = raw.trim();
                if (line.isEmpty() || line.startsWith("#")) continue;
                int separator = line.indexOf('=');
                if (separator < 1) continue;
                String key = line.substring(0, separator).trim();
                String value = unquote(line.substring(separator + 1).trim());
                if (System.getProperty(key) == null && System.getenv(key) == null) System.setProperty(key, value);
            }
        } catch (IOException exception) {
            throw new IllegalStateException("Cannot read server/.env", exception);
        }
    }
    private static String unquote(String value) {
        if (value.length() >= 2 && ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'")))) return value.substring(1, value.length() - 1);
        return value;
    }
}
