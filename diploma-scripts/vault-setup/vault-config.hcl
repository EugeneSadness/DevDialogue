# Хранилище данных
storage "file" {
  path = "/vault/data"
}

# Слушатель HTTP
listener "tcp" {
  address = "0.0.0.0:8200"
  tls_disable = 1
}

# API адрес
api_addr = "http://0.0.0.0:8200"

# Включаем UI
ui = true

# Настройки логирования
log_level = "Info"
log_format = "standard"

# Отключаем mlock для разработки (не для продакшн!)
disable_mlock = true

# Настройки кластера
cluster_addr = "http://0.0.0.0:8201"
