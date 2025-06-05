import fs from 'fs';
import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';
import express from 'express';
import QRCode from 'qrcode';
import dotenv from 'dotenv';
import cors from 'cors';
import { ToWords } from 'to-words';


dotenv.config();


// Sample patient data

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cloudinary.config({ 
        cloud_name: process.env.CLOUD_NAME, 
        api_key: process.env.API_KEY, 
        api_secret: process.env.API_SECRET 
    });


// const patientData = {
//   name: 'Dhairya Shah',
//   date: new Date(Date.now()).toLocaleDateString(),
//   amount: 1000,
//   onAccountOf: 'Dr. Dhara Shah',
//   paymentMode: 'Online'
// };

// Function to replace placeholders with actual data
function populateTemplate(template, data) {
  let output = template;
  for (const key in data) {
    const placeholder = `{{${key}}}`;
    output = output.replace(new RegExp(placeholder, 'g'), data[key]);
  }
  return output;
}

// (async () => {
//   try {
//     // Read the HTML template
//     const templatePath = path.join(__dirname, 'template.html');
//     const templateHtml = fs.readFileSync(templatePath, 'utf8');

//     // Populate the template with patient data
//     const filledHtml = populateTemplate(templateHtml, patientData);

//     // Launch Puppeteer
//     const browser = await puppeteer.launch();
//     const page = await browser.newPage();

//     // Set the HTML content
//     await page.setContent(filledHtml, { waitUntil: 'networkidle0' });

//     // Generate PDF
//     const fileName = `${uuidv4()}.pdf`
//     const pdfPath = path.join(__dirname, fileName);
//     await page.pdf({
//       path: pdfPath,
//       format: 'A4',
//       printBackground: true,
//       margin: {
//         top: '20mm',
//         bottom: '20mm',
//         left: '20mm',
//         right: '20mm'
//       }
//     });

//     console.log(`✅ PDF generated successfully at ${pdfPath}`);

//     await browser.close();

//     const uploadResult = await cloudinary.uploader
//        .upload(
//            path.join(__dirname, fileName), {
//                public_id: fileName.split('.')[0],
//            }
//        )
//        .catch((error) => {
//            console.log(error);
//        });
    
//     console.log(uploadResult);
//     const qrImage = await QRCode.toDataURL(pdfPath);
//   } catch (error) {
//     console.error('❌ Error generating PDF:', error);
//   }
// })();

const app = express();
const corsOptions = {
    origin: '*', // Allow all origins
};
app.use(cors(corsOptions));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to the Shreeji Clinic',
    })
})

app.get('/receipt', async(req, res) => {
    const { name, date, amount, onAccountOf, paymentMode, receiptNo } = req.query
    console.log("re", receiptNo);
    const toWords = new ToWords({
        localeCode: 'en-IN',
        converterOptions: {
            currency: true,
            ignoreDecimal: false,
            ignoreZeroCurrency: false,
            doNotAddOnly: false,
            currencyOptions: {
            // can be used to override defaults for the selected locale
            name: 'Rupee',
            plural: 'Rupees',
            symbol: '₹',
            fractionalUnit: {
                name: 'Paisa',
                plural: 'Paise',
                symbol: '',
            },
            },
        },
        });
    const patientData = {
        name: name || 'Dhairya Shah',
        date: date || new Date(Date.now()).toLocaleDateString(),
        amount: amount || 1000,
        amountWords: toWords.convert(amount) || 1000,
        onAccountOf: onAccountOf || 'Dr. Dhara Shah',
        paymentMode: paymentMode || 'Online',
        receiptNo: req.query.receiptNo || Math.floor(100000 + Math.random() * 900000).toString()
    }
    try {
    // Read the HTML template
    const templatePath = path.join(__dirname, 'template.html');
    const templateHtml = fs.readFileSync(templatePath, 'utf8');

    // Populate the template with patient data
    const filledHtml = populateTemplate(templateHtml, patientData);

    // Launch Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set the HTML content
    await page.setContent(filledHtml, { waitUntil: 'networkidle0' });

    // Generate PDF
    const fileName = `${uuidv4()}.pdf`
    const pdfPath = path.join(__dirname, fileName);
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '20mm',
        right: '20mm'
      }
    });

    console.log(`✅ PDF generated successfully at ${pdfPath}`);

    await browser.close();

    const uploadResult = await cloudinary.uploader
       .upload(
           path.join(__dirname, fileName), {
               public_id: fileName.split('.')[0],
           }
       )
       .catch((error) => {
           console.log(error);
       });
    
    console.log(uploadResult);
    const pdfUrl = `https://res.cloudinary.com/didzcqk5g/image/upload/f_auto,q_auto/${uploadResult.public_id}`;
    const qrImage = await QRCode.toDataURL(pdfUrl);

    fs.unlinkSync(pdfPath); // Clean up the local PDF file

    res.status(200).json({
        message: 'PDF generated successfully',
        pdfUrl: pdfUrl,
        qrImage: qrImage
    })

  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    const html = `
      <h2>Error generating receipt</h2>
      <p>${error.message}</p>
    `;
    res.status(500).send(html);
  }
})

app.listen(3000, () => {  
    console.log('Server is running on http://localhost:3000');
}) 
