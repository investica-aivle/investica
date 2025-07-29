import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import Tesseract from 'tesseract.js';
import { createCanvas } from '@napi-rs/canvas';
import * as path from 'path';

import axios from 'axios';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PdfService {
    async extractTextFromPdfUrl(pdfUrl: string): Promise<string> {
        const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
        const fontPath = path.join(__dirname, '..', 'node_modules', 'pdfjs-dist', 'standard_fonts') + path.sep;
        const cMapPath = path.join(__dirname, '..', 'node_modules', 'pdfjs-dist', 'cmaps') + path.sep;

        const loadingTask = pdfjsLib.getDocument({
            data: response.data,
            standardFontDataUrl: fontPath,
            cMapUrl: cMapPath,
            cMapPacked: true,
        }).promise;

        const pdf = await loadingTask;

        let fullText = '';

        for (let i = 1; i <= pdf.numPages / 3; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 3 });
            const canvas = createCanvas(viewport.width, viewport.height);
            const context = canvas.getContext('2d');

            const renderContext = {
                canvasContext: context,
                viewport: viewport,
            };

            await page.render(renderContext).promise;

            const imageBuffer = canvas.toBuffer('image/png');

            const result = await Tesseract.recognize(imageBuffer, 'kor+eng', {
                logger: (m) => console.log(m),
            });

            fullText += result.data.text + '\n\n';
            console.log(result.data.text);
        }
        fullText = fullText.replace(/\s{2,}/g, ' ');
        console.log(fullText);
        return fullText;
    }


}