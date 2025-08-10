import { Body, Controller, Post } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { PdfService } from '../../providers/pdf/PdfService';
import { Report } from '../../providers/pdf/JsonManagement';



@Controller('pdf')
export class AppController {
	constructor(private readonly pdfService: PdfService) { }

	@Post('regist')
	@ApiExcludeEndpoint()
	async registPdf(@Body() body: Report) {
		this.pdfService.registReport(body);
	}
}