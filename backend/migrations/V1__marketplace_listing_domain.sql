-- Stage 1 additive marketplace migration.
-- Run each ALTER only when the named column is absent. No existing row is updated.
ALTER TABLE Product ADD COLUMN itemCondition VARCHAR(32) NULL;
ALTER TABLE Product ADD COLUMN listingStatus VARCHAR(32) NULL;

CREATE TABLE IF NOT EXISTS ProductImage (
    productId BIGINT NOT NULL,
    position INT NOT NULL,
    imageUrl VARCHAR(2083) NOT NULL,
    PRIMARY KEY (productId, position),
    CONSTRAINT fk_product_image_product
        FOREIGN KEY (productId) REFERENCES Product(productId) ON DELETE CASCADE
);

-- Existing NULL values intentionally remain untouched. The application reads them
-- as GOOD / ACTIVE and continues using Product.imageUrl as the primary image.
