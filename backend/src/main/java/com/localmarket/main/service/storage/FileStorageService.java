package com.localmarket.main.service.storage;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.localmarket.main.exception.ApiException;
import com.localmarket.main.exception.ErrorType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.Map;
import java.util.UUID;
import java.util.Optional;

@Service
public class FileStorageService {

    private static final String DEFAULT_UPLOAD_DIR = "uploads/products";
    private static final int MAX_IMAGE_BYTES = 5_000_000;
    private final Path uploadPath;
    private final Cloudinary cloudinary;
    private final boolean remoteEnabled;

    public FileStorageService(
            @Value("${app.upload.dir:#{null}}") String configuredUploadDir,
            Cloudinary cloudinary,
            @Value("${app.storage.remote-enabled:false}") boolean remoteEnabled) {
        this.cloudinary = cloudinary;
        this.remoteEnabled = remoteEnabled;
        String uploadDir = (configuredUploadDir != null) ? configuredUploadDir : DEFAULT_UPLOAD_DIR;
        this.uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        
        try {
            Files.createDirectories(this.uploadPath);
        } catch (IOException ex) {
            throw new ApiException(ErrorType.FILE_STORAGE_ERROR, 
                "Could not create upload directory: " + this.uploadPath);
        }
    }

    public String storeFile(MultipartFile file) {
        try {
            if (file == null || file.isEmpty() || file.getSize() > MAX_IMAGE_BYTES) {
                throw new ApiException(ErrorType.INVALID_FILE, "Image must be between 1 byte and 5 MB");
            }
            byte[] bytes = file.getBytes();
            String extension = validatedExtension(bytes, file.getContentType());

            if (remoteEnabled) {
                try {
                    Map<?, ?> uploadResult = cloudinary.uploader().upload(bytes, ObjectUtils.emptyMap());
                    Object secureUrl = uploadResult.get("secure_url");
                    if (secureUrl instanceof String url && url.startsWith("https://")) {
                        return url;
                    }
                } catch (Exception ignored) {
                    // Optional remote storage is unavailable; retain the validated image locally.
                }
            }
            String filename = UUID.randomUUID() + extension;
            Path targetLocation = uploadPath.resolve(filename);
            Files.write(targetLocation, bytes, StandardOpenOption.CREATE_NEW);
            return "/api/listings/images/" + filename;
        } catch (IOException ex) {
            throw new ApiException(ErrorType.FILE_STORAGE_ERROR, "Could not store file");
        }
    }

    public Resource loadFileAsResource(String filename) {
        try {
            if (filename == null || filename.contains("/") || filename.contains("\\")
                || !filename.matches("(?i)[a-z0-9-]+\\.(jpe?g|png|webp)")) {
                throw new ApiException(ErrorType.INVALID_FILE, "Invalid stored file path");
            }
            Path filePath = this.uploadPath.resolve(filename).normalize();
            if (!filePath.startsWith(this.uploadPath)) {
                throw new ApiException(ErrorType.INVALID_FILE, "Invalid stored file path");
            }
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists()) {
                return resource;
            }
            
            throw new ApiException(ErrorType.FILE_NOT_FOUND, "File not found");
        } catch (IOException ex) {
            throw new ApiException(ErrorType.FILE_NOT_FOUND, "File not found");
        }
    }

    private String validatedExtension(byte[] bytes, String contentType) {
        if (bytes.length == 0 || bytes.length > MAX_IMAGE_BYTES) {
            throw new ApiException(ErrorType.INVALID_FILE, "Image must be between 1 byte and 5 MB");
        }
        if ("image/jpeg".equalsIgnoreCase(contentType) && bytes.length >= 3
            && (bytes[0] & 0xff) == 0xff && (bytes[1] & 0xff) == 0xd8
            && (bytes[2] & 0xff) == 0xff) {
            return ".jpg";
        }
        if ("image/png".equalsIgnoreCase(contentType) && bytes.length >= 8
            && (bytes[0] & 0xff) == 0x89 && bytes[1] == 'P' && bytes[2] == 'N'
            && bytes[3] == 'G' && bytes[4] == 13 && bytes[5] == 10
            && bytes[6] == 26 && bytes[7] == 10) {
            return ".png";
        }
        if ("image/webp".equalsIgnoreCase(contentType) && bytes.length >= 12
            && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
            && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P') {
            return ".webp";
        }
        throw new ApiException(ErrorType.INVALID_FILE, "Only JPEG, PNG, or WebP images are allowed");
    }

    /** Deletes only files owned by this application's local upload directory. */
    public boolean deleteLocalFile(String storedUrl) {
        Optional<String> filename = localFilename(storedUrl);
        if (filename.isEmpty()) {
            return false;
        }
        Path target = uploadPath.resolve(filename.get()).normalize();
        if (!target.startsWith(uploadPath)) {
            throw new ApiException(ErrorType.INVALID_FILE, "Invalid stored file path");
        }
        try {
            return Files.deleteIfExists(target);
        } catch (IOException ex) {
            throw new ApiException(ErrorType.FILE_STORAGE_ERROR, "Could not delete stored file");
        }
    }

    private Optional<String> localFilename(String storedUrl) {
        if (storedUrl == null || storedUrl.isBlank() || storedUrl.startsWith("http")) {
            return Optional.empty();
        }
        String productsPrefix = "/api/products/images/";
        String listingsPrefix = "/api/listings/images/";
        String filename;
        if (storedUrl.startsWith(productsPrefix)) {
            filename = storedUrl.substring(productsPrefix.length());
        } else if (storedUrl.startsWith(listingsPrefix)) {
            filename = storedUrl.substring(listingsPrefix.length());
        } else {
            return Optional.empty();
        }
        if (filename.isBlank() || filename.contains("/") || filename.contains("\\")) {
            return Optional.empty();
        }
        return Optional.of(filename);
    }

    public Path getUploadPath() {
        return this.uploadPath;
    }
} 
