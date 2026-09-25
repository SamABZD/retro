-- Additive, data-preserving order history fields.
-- Existing rows remain valid; services fall back to the linked listing when a
-- legacy row has no snapshot value.
ALTER TABLE OrderItem ADD COLUMN productTitleSnapshot VARCHAR(255) NULL;
ALTER TABLE OrderItem ADD COLUMN productImageSnapshot VARCHAR(2083) NULL;
ALTER TABLE OrderItem ADD COLUMN sellerIdSnapshot BIGINT NULL;
ALTER TABLE OrderItem ADD COLUMN sellerNameSnapshot VARCHAR(255) NULL;
