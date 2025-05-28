const fs = require('fs');
const path = require('path');

// Функция для чтения результатов теста из файла
function readTestResults(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Ошибка при чтении файла результатов: ${error.message}`);
    
    // Попробуем найти временный или резервный файл, если основной не найден
    if (error.code === 'ENOENT') {
      const dir = path.dirname(filePath);
      const tempFilePath = filePath + '.temp';
      const backupFilePath = path.join(dir, 'stress-test-metrics-backup.json');
      
      if (fs.existsSync(tempFilePath)) {
        console.log(`Найден временный файл: ${tempFilePath}. Используем его.`);
        const tempData = fs.readFileSync(tempFilePath, 'utf8');
        return JSON.parse(tempData);
      } else if (fs.existsSync(backupFilePath)) {
        console.log(`Найден резервный файл: ${backupFilePath}. Используем его.`);
        const backupData = fs.readFileSync(backupFilePath, 'utf8');
        return JSON.parse(backupData);
      }
    }
    
    process.exit(1);
  }
}

// Функция для анализа результатов и определения максимальной нагрузки
function analyzeResults(results) {
  const { metadata, metrics } = results;
  
  // Общая информация
  console.log('===== ОБЩАЯ ИНФОРМАЦИЯ О ТЕСТЕ =====');
  console.log(`Период тестирования: ${metadata.startTime} - ${metadata.endTime}`);
  console.log(`Интервал сбора метрик: ${metadata.samplingInterval} мс`);
  console.log(`Мониторинг контейнеров: ${metadata.monitoredContainers.join(', ')}`);
  console.log(`Общее количество собранных замеров: ${metrics.length}`);
  console.log('');
  
  // Определяем максимальную нагрузку по контейнерам
  const containerStats = {};
  metadata.monitoredContainers.forEach(container => {
    containerStats[container] = {
      maxCpu: 0,
      maxCpuTimestamp: '',
      maxMem: 0,
      maxMemTimestamp: '',
      avgCpu: 0,
      avgMem: 0,
      cpuSamples: [],
      memSamples: []
    };
  });
  
  // Анализ метрик системы
  let systemMaxCpu = 0;
  let systemMaxCpuTimestamp = '';
  let systemMaxMem = 0;
  let systemMaxMemTimestamp = '';
  const systemCpuSamples = [];
  const systemMemSamples = [];
  
  // Собираем статистику
  metrics.forEach(metric => {
    // Системные метрики
    const systemCpu = metric.system.cpu.usage;
    const systemMem = metric.system.memory.usedPercentage;
    
    systemCpuSamples.push(systemCpu);
    systemMemSamples.push(systemMem);
    
    if (systemCpu > systemMaxCpu) {
      systemMaxCpu = systemCpu;
      systemMaxCpuTimestamp = metric.timestamp;
    }
    
    if (systemMem > systemMaxMem) {
      systemMaxMem = systemMem;
      systemMaxMemTimestamp = metric.timestamp;
    }
    
    // Метрики контейнеров
    if (metric.docker) {
      metric.docker.forEach(containerMetric => {
        const containerName = containerMetric.Name;
        
        if (containerStats[containerName]) {
          // Преобразуем строки с процентами в числа
          const cpuPerc = parseFloat(containerMetric.CPUPerc.replace('%', ''));
          const memPerc = parseFloat(containerMetric.MemPerc.replace('%', ''));
          
          containerStats[containerName].cpuSamples.push(cpuPerc);
          containerStats[containerName].memSamples.push(memPerc);
          
          if (cpuPerc > containerStats[containerName].maxCpu) {
            containerStats[containerName].maxCpu = cpuPerc;
            containerStats[containerName].maxCpuTimestamp = metric.timestamp;
          }
          
          if (memPerc > containerStats[containerName].maxMem) {
            containerStats[containerName].maxMem = memPerc;
            containerStats[containerName].maxMemTimestamp = metric.timestamp;
          }
        }
      });
    }
  });
  
  // Вычисляем средние значения
  const calcAverage = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
  
  const systemAvgCpu = calcAverage(systemCpuSamples);
  const systemAvgMem = calcAverage(systemMemSamples);
  
  Object.keys(containerStats).forEach(container => {
    containerStats[container].avgCpu = calcAverage(containerStats[container].cpuSamples);
    containerStats[container].avgMem = calcAverage(containerStats[container].memSamples);
  });
  
  // Выводим результаты по системе
  console.log('===== СИСТЕМНЫЕ РЕСУРСЫ =====');
  console.log(`Максимальная нагрузка на CPU: ${systemMaxCpu.toFixed(2)}% (${systemMaxCpuTimestamp})`);
  console.log(`Средняя нагрузка на CPU: ${systemAvgCpu.toFixed(2)}%`);
  console.log(`Максимальное использование памяти: ${systemMaxMem.toFixed(2)}% (${systemMaxMemTimestamp})`);
  console.log(`Среднее использование памяти: ${systemAvgMem.toFixed(2)}%`);
  console.log('');
  
  // Выводим результаты по контейнерам
  console.log('===== НАГРУЗКА ПО КОНТЕЙНЕРАМ =====');
  Object.keys(containerStats).forEach(container => {
    const stats = containerStats[container];
    console.log(`>> Контейнер: ${container}`);
    console.log(`   Максимальная нагрузка на CPU: ${stats.maxCpu.toFixed(2)}% (${stats.maxCpuTimestamp})`);
    console.log(`   Средняя нагрузка на CPU: ${stats.avgCpu.toFixed(2)}%`);
    console.log(`   Максимальное использование памяти: ${stats.maxMem.toFixed(2)}% (${stats.maxMemTimestamp})`);
    console.log(`   Среднее использование памяти: ${stats.avgMem.toFixed(2)}%`);
    console.log('');
  });
  
  // Определение узких мест
  console.log('===== ВЫЯВЛЕННЫЕ УЗКИЕ МЕСТА =====');
  
  // Узкие места по CPU
  const cpuBottlenecks = Object.keys(containerStats)
    .filter(container => containerStats[container].maxCpu > 80)
    .sort((a, b) => containerStats[b].maxCpu - containerStats[a].maxCpu);
  
  if (cpuBottlenecks.length > 0) {
    console.log('Контейнеры с высокой нагрузкой на CPU:');
    cpuBottlenecks.forEach(container => {
      console.log(`- ${container}: ${containerStats[container].maxCpu.toFixed(2)}%`);
    });
  } else {
    console.log('Высокой нагрузки на CPU не выявлено.');
  }
  
  // Узкие места по памяти
  const memBottlenecks = Object.keys(containerStats)
    .filter(container => containerStats[container].maxMem > 80)
    .sort((a, b) => containerStats[b].maxMem - containerStats[a].maxMem);
  
  if (memBottlenecks.length > 0) {
    console.log('Контейнеры с высоким использованием памяти:');
    memBottlenecks.forEach(container => {
      console.log(`- ${container}: ${containerStats[container].maxMem.toFixed(2)}%`);
    });
  } else {
    console.log('Высокого использования памяти не выявлено.');
  }
  
  // Оценка максимальной нагрузки
  console.log('');
  console.log('===== ОЦЕНКА МАКСИМАЛЬНОЙ НАГРУЗКИ =====');
  
  let maxOnlineUsers = 0;
  let limitingResource = '';
  let limitingContainer = '';
  
  // Определяем лимитирующий фактор (CPU или память)
  const cpuLimited = cpuBottlenecks.length > 0;
  const memLimited = memBottlenecks.length > 0;
  
  if (cpuLimited || memLimited) {
    if (cpuLimited) {
      limitingResource = 'CPU';
      limitingContainer = cpuBottlenecks[0];
      // Оценка максимальных пользователей исходя из CPU
      const cpuHeadroom = (100 - containerStats[limitingContainer].maxCpu) / containerStats[limitingContainer].maxCpu;
      maxOnlineUsers = metrics.length * (1 + cpuHeadroom * 0.7); // 70% от теоретического максимума для запаса
    } else {
      limitingResource = 'Memory';
      limitingContainer = memBottlenecks[0];
      // Оценка максимальных пользователей исходя из памяти
      const memHeadroom = (100 - containerStats[limitingContainer].maxMem) / containerStats[limitingContainer].maxMem;
      maxOnlineUsers = metrics.length * (1 + memHeadroom * 0.7); // 70% от теоретического максимума для запаса
    }
    
    console.log(`Ограничивающий ресурс: ${limitingResource} в контейнере ${limitingContainer}`);
    console.log(`Оценка максимального количества одновременных пользователей: ~${Math.round(maxOnlineUsers)}`);
  } else {
    console.log('Система имеет запас ресурсов. Рекомендуется увеличить нагрузку для точного определения максимума.');
  }
  
  // Рекомендации по улучшению
  console.log('');
  console.log('===== РЕКОМЕНДАЦИИ =====');
  
  if (cpuLimited) {
    console.log(`1. Увеличить CPU для контейнера ${limitingContainer}`);
    console.log('2. Оптимизировать код для снижения нагрузки на CPU');
  }
  
  if (memLimited) {
    console.log(`1. Увеличить выделенную память для контейнера ${limitingContainer}`);
    console.log('2. Проверить наличие утечек памяти');
  }
  
  if (!cpuLimited && !memLimited) {
    console.log('1. Увеличить нагрузку в стресс-тесте для определения пределов системы');
    console.log('2. Добавить мониторинг других ресурсов (диск I/O, сеть)');
  }
  
  return {
    systemStats: {
      maxCpu: systemMaxCpu,
      avgCpu: systemAvgCpu,
      maxMem: systemMaxMem,
      avgMem: systemAvgMem
    },
    containerStats,
    bottlenecks: {
      cpu: cpuBottlenecks,
      memory: memBottlenecks
    },
    estimatedMaxUsers: Math.round(maxOnlineUsers)
  };
}

// Основная функция
function main() {
  const resultsFile = path.join(__dirname, 'stress-test-metrics.json');
  
  console.log(`Анализ результатов из файла: ${resultsFile}`);
  const results = readTestResults(resultsFile);
  
  analyzeResults(results);
}

// Запуск скрипта
main(); 