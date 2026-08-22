package com.chulsooya.server.domain.sellerapplication;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.client.RestClient;

class SellerCertificateStorageTest {
    private HttpServer server;
    private final List<RecordedRequest> requests = new ArrayList<>();
    private int bucketLookupStatus;

    @BeforeEach
    void setUp() throws IOException {
        bucketLookupStatus = 404;
        server = HttpServer.create(new InetSocketAddress(0), 0);
        server.createContext("/storage/v1/bucket/seller-verification-documents", this::handleBucketLookup);
        server.createContext("/storage/v1/bucket", this::handleBucketCreation);
        server.createContext("/storage/v1/object/seller-verification-documents", this::handleObjectRequest);
        server.start();
    }

    @AfterEach
    void tearDown() {
        server.stop(0);
    }

    @Test
    void createsPrivateConstrainedBucketOnlyWhenTheBucketIsMissing() {
        SellerCertificateStorage storage = storage();

        String objectKey = storage.upload(42L, SellerApplicationDocumentType.BUSINESS_LICENSE, imageFile("license.png"));

        assertTrue(objectKey.startsWith("seller-applications/42/business-license/"));
        assertEquals(3, requests.size());
        assertEquals("GET", requests.get(0).method());
        assertEquals("POST", requests.get(1).method());
        assertTrue(requests.get(1).body().contains("\"public\":false"));
        assertTrue(requests.get(1).body().contains("\"file_size_limit\":10485760"));
        assertTrue(requests.get(1).body().contains("image/jpeg"));
        assertTrue(requests.get(1).body().contains("image/png"));
        assertEquals("PUT", requests.get(2).method());
        assertTrue(requests.get(2).path().startsWith("/storage/v1/object/seller-verification-documents/"));
    }

    @Test
    void uploadsToExistingBucketWithoutTryingToCreateItAgain() {
        bucketLookupStatus = 200;
        SellerCertificateStorage storage = storage();

        storage.upload(77L, SellerApplicationDocumentType.BANK_ACCOUNT_COPY, imageFile("bank.png"));

        assertEquals(2, requests.size());
        assertEquals("GET", requests.get(0).method());
        assertEquals("PUT", requests.get(1).method());
    }

    private SellerCertificateStorage storage() {
        return new SellerCertificateStorage("http://localhost:" + server.getAddress().getPort(), "test-service-key", RestClient.create());
    }

    private MockMultipartFile imageFile(String filename) {
        return new MockMultipartFile("file", filename, MediaType.IMAGE_PNG_VALUE, new byte[] {1, 2, 3});
    }

    private void handleBucketLookup(HttpExchange exchange) throws IOException {
        record(exchange);
        respond(exchange, bucketLookupStatus, "{}");
    }

    private void handleBucketCreation(HttpExchange exchange) throws IOException {
        record(exchange);
        respond(exchange, 201, "{}");
    }

    private void handleObjectRequest(HttpExchange exchange) throws IOException {
        record(exchange);
        respond(exchange, 200, "{}");
    }

    private void record(HttpExchange exchange) throws IOException {
        requests.add(new RecordedRequest(exchange.getRequestMethod(), exchange.getRequestURI().getPath(), new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8)));
    }

    private void respond(HttpExchange exchange, int status, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", MediaType.APPLICATION_JSON_VALUE);
        exchange.sendResponseHeaders(status, bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }

    private record RecordedRequest(String method, String path, String body) {
    }
}
