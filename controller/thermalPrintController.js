const net = require('net');
const asyncHandler = require("express-async-handler");

// Print to thermal printer via network
exports.printThermalReceipt = asyncHandler(async (req, res) => {
  const { text, printerIP = '192.168.1.100', port = 9100, timeout = 5000 } = req.body;

  if (!text) {
    res.status(400);
    throw new Error("Receipt text is required");
  }

  try {
    const result = await printToThermalPrinter(text, printerIP, port, timeout);
    
    res.status(200).json({
      success: true,
      message: "Receipt printed successfully",
      printerIP,
      port,
      ...result
    });
  } catch (error) {
    console.error('Thermal printing error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to print receipt",
      error: error.message,
      printerIP,
      port
    });
  }
});

// Print to thermal printer via USB/Serial (Node.js)
exports.printThermalReceiptUSB = asyncHandler(async (req, res) => {
  const { text, devicePath = '/dev/usb/lp0' } = req.body;

  if (!text) {
    res.status(400);
    throw new Error("Receipt text is required");
  }

  try {
    const fs = require('fs');
    
    // ESC/POS commands
    const initPrinter = '\x1B\x40'; // ESC @ (Initialize)
    const cutPaper = '\x1D\x56\x42\x00'; // Partial cut
    const feedPaper = '\n\n\n';
    
    const printData = initPrinter + text + cutPaper + feedPaper;
    
    // Write directly to USB device
    fs.writeFileSync(devicePath, printData);
    
    res.status(200).json({
      success: true,
      message: "Receipt printed successfully via USB",
      devicePath
    });
  } catch (error) {
    console.error('USB thermal printing error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to print receipt via USB",
      error: error.message,
      devicePath
    });
  }
});

// Helper function to print via network
function printToThermalPrinter(text, printerIP, port, timeout) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let isResolved = false;

    // Set timeout
    const timeoutId = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        client.destroy();
        reject(new Error(`Connection timeout after ${timeout}ms`));
      }
    }, timeout);

    client.connect(port, printerIP, () => {
      console.log(`Connected to thermal printer at ${printerIP}:${port}`);
      
      // ESC/POS commands for thermal printer
      const initPrinter = '\x1B\x40'; // ESC @ (Initialize)
      const setFont = '\x1B\x21\x00'; // Normal font
      const setAlign = '\x1B\x61\x00'; // Left align
      const cutPaper = '\x1D\x56\x42\x00'; // Partial cut
      const feedPaper = '\n\n\n';
      
      const printData = initPrinter + setFont + setAlign + text + cutPaper + feedPaper;
      
      client.write(printData);
    });

    client.on('data', (data) => {
      console.log('Printer response:', data.toString());
    });

    client.on('close', () => {
      console.log('Connection to thermal printer closed');
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeoutId);
        resolve({
          status: 'printed',
          timestamp: new Date().toISOString()
        });
      }
    });

    client.on('error', (error) => {
      console.error('Thermal printer connection error:', error);
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeoutId);
        reject(new Error(`Printer connection failed: ${error.message}`));
      }
    });

    // Close connection after sending data
    setTimeout(() => {
      if (!client.destroyed) {
        client.end();
      }
    }, 1000);
  });
}

// Get available thermal printers (for discovery)
exports.discoverThermalPrinters = asyncHandler(async (req, res) => {
  const { networkRange = '192.168.1', startIP = 1, endIP = 254, port = 9100 } = req.query;
  
  const availablePrinters = [];
  const promises = [];

  for (let i = startIP; i <= endIP; i++) {
    const ip = `${networkRange}.${i}`;
    promises.push(checkPrinterAvailability(ip, port));
  }

  try {
    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.available) {
        availablePrinters.push({
          ip: `${networkRange}.${startIP + index}`,
          port: port,
          status: 'available',
          responseTime: result.value.responseTime
        });
      }
    });

    res.status(200).json({
      success: true,
      message: `Found ${availablePrinters.length} thermal printers`,
      printers: availablePrinters,
      scannedRange: `${networkRange}.${startIP}-${endIP}:${port}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to discover thermal printers",
      error: error.message
    });
  }
});

// Helper function to check printer availability
function checkPrinterAvailability(ip, port, timeout = 2000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const client = new net.Socket();
    
    const timeoutId = setTimeout(() => {
      client.destroy();
      resolve({ available: false, ip, port });
    }, timeout);

    client.connect(port, ip, () => {
      const responseTime = Date.now() - startTime;
      clearTimeout(timeoutId);
      client.end();
      resolve({ available: true, ip, port, responseTime });
    });

    client.on('error', () => {
      clearTimeout(timeoutId);
      resolve({ available: false, ip, port });
    });
  });
}