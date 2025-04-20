const os = require('os');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Конфигурация мониторинга
const MONITOR_CONFIG = {
  interval: 2000, // интервал сбора метрик в мс
  outputFile: path.join(__dirname, 'stress-test-metrics.json'),
  csvFile: path.join(__dirname, 'stress-test-metrics.csv'),
  duration: 180000, // продолжительность мониторинга в мс (3 минуты)
  dockerContainers: ['backend', 'postgres', 'redis'] // контейнеры для мониторинга
};

// Массив для хранения метрик
const metrics = [];

// Функция для получения метрик Docker контейнеров
function getDockerStats() {
  return new Promise((resolve, reject) => {
    // Формируем команду для получения статистики контейнеров в формате JSON
    const containerNames = MONITOR_CONFIG.dockerContainers.join(' ');
    const command = `docker stats ${containerNames} --no-stream --format "{{json .}}"`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing docker stats command: ${error.message}`);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.error(`Docker stats stderr: ${stderr}`);
      }
      
      try {
        // Парсим результаты
        const lines = stdout.trim().split('\n');
        const containerStats = lines.map(line => JSON.parse(line));
        resolve(containerStats);
      } catch (parseError) {
        console.error(`Error parsing docker stats output: ${parseError.message}`);
        reject(parseError);
      }
    });
  });
}

// Функция для получения системных ресурсов
function getSystemResources() {
  const timestamp = new Date().toISOString();
  const cpus = os.cpus();
  const totalCpuUsage = cpus.reduce((acc, cpu) => {
    const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
    const idle = cpu.times.idle;
    return acc + ((total - idle) / total);
  }, 0) / cpus.length;
  
  const freeMemPercentage = os.freemem() / os.totalmem();
  const usedMemPercentage = 1 - freeMemPercentage;
  
  return {
    timestamp,
    system: {
      cpu: {
        usage: totalCpuUsage * 100, // в процентах
        cores: cpus.length
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usedPercentage: usedMemPercentage * 100 // в процентах
      },
      uptime: os.uptime()
    }
  };
}

// Основная функция мониторинга
async function monitor() {
  console.log(`Начало мониторинга ресурсов с интервалом ${MONITOR_CONFIG.interval}ms`);
  console.log(`Мониторинг продлится ${MONITOR_CONFIG.duration / 1000} секунд`);
  console.log(`Контейнеры для мониторинга: ${MONITOR_CONFIG.dockerContainers.join(', ')}`);
  console.log(`Метрики будут сохранены в: ${MONITOR_CONFIG.outputFile}`);
  console.log(`CSV-отчет будет сохранен в: ${MONITOR_CONFIG.csvFile}`);
  
  // Создадим директорию, если она не существует
  const dir = path.dirname(MONITOR_CONFIG.outputFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const intervalId = setInterval(async () => {
    try {
      // Получаем метрики системы
      const systemMetrics = getSystemResources();
      
      // Получаем метрики Docker
      const dockerMetrics = await getDockerStats();
      
      // Объединяем метрики
      const metricSnapshot = {
        ...systemMetrics,
        docker: dockerMetrics
      };
      
      // Добавляем в массив метрик
      metrics.push(metricSnapshot);
      
      // Логируем базовую информацию
      console.log(`[${systemMetrics.timestamp}] CPU: ${systemMetrics.system.cpu.usage.toFixed(2)}%, Memory: ${systemMetrics.system.memory.usedPercentage.toFixed(2)}%`);
      
      for (const container of dockerMetrics) {
        console.log(`- ${container.Name}: CPU: ${container.CPUPerc}, Memory: ${container.MemPerc}`);
      }
      
      // Периодически сохраняем метрики в файл для защиты от потери данных
      if (metrics.length % 10 === 0) {
        saveTempMetrics();
      }
    } catch (error) {
      console.error('Ошибка при сборе метрик:', error);
    }
  }, MONITOR_CONFIG.interval);
  
  // Функция для временного сохранения метрик
  function saveTempMetrics() {
    try {
      const tempFile = MONITOR_CONFIG.outputFile + '.temp';
      fs.writeFileSync(
        tempFile, 
        JSON.stringify({
          metadata: {
            startTime: new Date(Date.now() - (metrics.length * MONITOR_CONFIG.interval)).toISOString(),
            endTime: new Date().toISOString(),
            samplingInterval: MONITOR_CONFIG.interval,
            monitoredContainers: MONITOR_CONFIG.dockerContainers
          },
          metrics: metrics
        }, null, 2)
      );
    } catch (error) {
      console.error('Ошибка при сохранении временных метрик:', error);
    }
  }
  
  // Остановка мониторинга по истечении времени
  setTimeout(() => {
    clearInterval(intervalId);
    
    try {
      // Сохраняем собранные метрики в файл
      fs.writeFileSync(
        MONITOR_CONFIG.outputFile, 
        JSON.stringify({
          metadata: {
            startTime: new Date(Date.now() - MONITOR_CONFIG.duration).toISOString(),
            endTime: new Date().toISOString(),
            samplingInterval: MONITOR_CONFIG.interval,
            monitoredContainers: MONITOR_CONFIG.dockerContainers
          },
          metrics: metrics
        }, null, 2)
      );
      
      console.log(`Мониторинг завершен. Метрики сохранены в файл ${MONITOR_CONFIG.outputFile}`);
      
      // Создаем дополнительный CSV файл для удобства анализа
      createCsvReport();
    } catch (error) {
      console.error('Ошибка при сохранении метрик:', error);
      // В случае ошибки сохранения, пытаемся сохранить во временный файл
      const backupFile = path.join(__dirname, 'stress-test-metrics-backup.json');
      fs.writeFileSync(
        backupFile, 
        JSON.stringify({
          metadata: {
            startTime: new Date(Date.now() - MONITOR_CONFIG.duration).toISOString(),
            endTime: new Date().toISOString(),
            samplingInterval: MONITOR_CONFIG.interval,
            monitoredContainers: MONITOR_CONFIG.dockerContainers
          },
          metrics: metrics
        }, null, 2)
      );
      console.log(`Резервная копия метрик сохранена в ${backupFile}`);
    }
    
    process.exit(0);
  }, MONITOR_CONFIG.duration);
}

// Функция для создания CSV отчета
function createCsvReport() {
  try {
    // Создаем заголовок CSV
    let csvContent = 'Timestamp,System CPU (%),System Memory (%),';
    MONITOR_CONFIG.dockerContainers.forEach(container => {
      csvContent += `${container} CPU (%),${container} Memory (%),`;
    });
    csvContent = csvContent.slice(0, -1) + '\n'; // Удаляем последнюю запятую и добавляем перевод строки
    
    // Добавляем данные
    metrics.forEach(metric => {
      csvContent += `${metric.timestamp},${metric.system.cpu.usage.toFixed(2)},${metric.system.memory.usedPercentage.toFixed(2)},`;
      
      // Поиск метрик для каждого контейнера
      MONITOR_CONFIG.dockerContainers.forEach(containerName => {
        const containerData = metric.docker.find(c => c.Name === containerName);
        if (containerData) {
          // Удаляем символ % из строк и преобразуем в числа
          const cpuPerc = parseFloat(containerData.CPUPerc.replace('%', ''));
          const memPerc = parseFloat(containerData.MemPerc.replace('%', ''));
          csvContent += `${cpuPerc.toFixed(2)},${memPerc.toFixed(2)},`;
        } else {
          csvContent += '0,0,';
        }
      });
      
      csvContent = csvContent.slice(0, -1) + '\n'; // Удаляем последнюю запятую и добавляем перевод строки
    });
    
    fs.writeFileSync(MONITOR_CONFIG.csvFile, csvContent);
    console.log(`CSV отчет сохранен в файл ${MONITOR_CONFIG.csvFile}`);
  } catch (error) {
    console.error('Ошибка при создании CSV отчета:', error);
    // Пытаемся сохранить в альтернативный файл
    const backupCsvFile = path.join(__dirname, 'stress-test-metrics-backup.csv');
    fs.writeFileSync(backupCsvFile, csvContent);
    console.log(`Резервная копия CSV отчета сохранена в ${backupCsvFile}`);
  }
}

// Запускаем мониторинг
monitor(); 