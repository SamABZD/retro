package com.localmarket.main;

import com.localmarket.main.service.storage.FileStorageService;
import com.localmarket.main.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FileStorageServiceTests {
    @TempDir
    Path uploadDirectory;

    @Test
    void onlyOwnedLocalFilesAreDeleted() throws Exception {
        FileStorageService storage = new FileStorageService(uploadDirectory.toString(), null, false);
        Path owned = Files.writeString(uploadDirectory.resolve("owned.png"), "demo");

        assertFalse(storage.deleteLocalFile("https://example.com/shared.png"));
        assertFalse(storage.deleteLocalFile("/api/products/images/../outside.png"));
        assertTrue(Files.exists(owned));
        assertTrue(storage.deleteLocalFile("/api/products/images/owned.png"));
        assertFalse(Files.exists(owned));
        assertFalse(storage.deleteLocalFile("/api/products/images/owned.png"));
    }

    @Test
    void validImageUsesServerGeneratedNameAndMismatchedOrActiveContentIsRejected() throws Exception {
        FileStorageService storage = new FileStorageService(uploadDirectory.toString(), null, false);
        byte[] png = Base64.getDecoder().decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==");
        String url = storage.storeFile(new MockMultipartFile("image", "../../trick.svg", "image/png", png));
        assertTrue(url.matches("/api/listings/images/[a-f0-9-]+\\.png"));
        assertTrue(storage.loadFileAsResource(url.substring(url.lastIndexOf('/') + 1)).exists());

        assertThrows(ApiException.class, () -> storage.storeFile(
            new MockMultipartFile("image", "image.svg", "image/svg+xml", "<svg/>".getBytes())));
        assertThrows(ApiException.class, () -> storage.storeFile(
            new MockMultipartFile("image", "fake.png", "image/png", "not a png".getBytes())));
        assertThrows(ApiException.class, () -> storage.loadFileAsResource("https://example.com/image.jpg"));
        assertThrows(ApiException.class, () -> storage.loadFileAsResource("../outside.png"));
    }

    @Test
    void oversizedUnsupportedAndExecutablePayloadsAreRejectedWithoutWritingFiles() throws Exception {
        FileStorageService storage = new FileStorageService(uploadDirectory.toString(), null, false);

        assertThrows(ApiException.class, () -> storage.storeFile(
            new MockMultipartFile("image", "oversized.png", "image/png", new byte[5_000_001])));
        assertThrows(ApiException.class, () -> storage.storeFile(
            new MockMultipartFile("image", "notes.txt", "text/plain", "plain text".getBytes())));
        assertThrows(ApiException.class, () -> storage.storeFile(
            new MockMultipartFile("image", "renamed-executable.png", "image/png",
                new byte[] {'M', 'Z', 0, 0, 0, 0, 0, 0})));
        assertThrows(ApiException.class, () -> storage.storeFile(
            new MockMultipartFile("image", "malformed.jpg", "image/jpeg",
                new byte[] {(byte) 0xff, (byte) 0xd8})));

        try (var files = Files.list(uploadDirectory)) {
            assertEquals(0, files.count());
        }
    }
}
