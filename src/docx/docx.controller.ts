import { Body, Controller, Get, HttpStatus, Post, Query, Res } from '@nestjs/common';
import { DocxService } from './docx.service';
import { Response } from 'express';

@Controller('docx')
export class DocxController {

    constructor(private readonly docxServie:DocxService){}


    @Post("create")
async downloadDocx(@Body() body: any, @Res() res: Response) {
    const { agentId } = body;

    const resp = await  this.docxServie.reportDocxDirectDownload(agentId);
        if(resp.success){

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            res.setHeader('Content-Disposition', 'attachment; filename=Report.docx');
            res.send(resp.data)
        }else{
            console.error('Error generating DOCX:', resp.msg);
            res.json({
                success: false,
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                msg: resp.msg
            });
        }
}


@Get("agentCourse")
async getAgentCourse(@Query("agentId") agentId:string){
    return this.docxServie.agentCourse(agentId)
}


}
