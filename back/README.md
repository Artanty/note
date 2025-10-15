CREATE TABLE keywords (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  color INT NOT NULL COMMENT 'Stores color as hex value (0xRRGGBB)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_keywords_name (name)
) ENGINE=InnoDB;

CREATE TABLE keyword_to_user (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  keyword_id BIGINT NOT NULL,
  user_handler VARCHAR(255) NOT NULL,
  access_level INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (keyword_id) REFERENCES keywords(id) ON DELETE CASCADE,
  UNIQUE KEY (keyword_id, user_handle),
  KEY (user_handle)
) ENGINE=InnoDB;

## get/validate entity's user
при запросе сущности в хэдерах приходит:
- hostOrigin: `${req.protocol}://${req.get('host')}`,
- accessToken: headers['Authorization'] \\ `Bearer ${accessToken}`

ищем в StorageService переменную tokenMap[${hostOrigin}]
сравниваем accessToken.
Если ок - то берем оттуда userHandler

Если нет переменной - возможно сервер был перезагружен и остался файл.

идем в файловый сторадж, ищем в папке ${hostOrigin} файл token.json
сравниваем accessToken.
Если ок - то берем оттуда userHandler

Если accessToken не совпадает
1. удаляем файл.
2. возвращаем 403.
3. todo ver 4.0: пробуем обновить accessToken через refreshToken


==
1 - read
2 - write
3 - admin
4 - owner
