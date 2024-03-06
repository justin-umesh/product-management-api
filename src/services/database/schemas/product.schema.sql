-- Create Product table
CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            price DECIMAL(10,2) NOT NULL,
            status ENUM('active', 'draft', 'archived') DEFAULT 'active',
            views INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
        -- Indexes for efficient querying
        CREATE INDEX idx_name ON products(name);
        CREATE INDEX idx_status ON products(status);
        CREATE INDEX idx_views ON products(views);
        CREATE INDEX idx_created_at ON products(created_at);