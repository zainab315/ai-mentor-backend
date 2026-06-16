import { Injectable } from '@nestjs/common';

import { AgentService } from './agent/agent.service';
import * as fs from 'fs';
import * as path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { ImageModule } from 'docxtemplater-image-module-free';

@Injectable()
export class DocxService {

    constructor(
        private readonly AgentService:AgentService,
        ){

    }


public async reportDocxDirectDownload(agentId: any): Promise<any> {
  try {
      const agent = await this.AgentService.findOne(agentId);
      if (!agent) {
          return {
              success: false,
              msg: "Process of generating DOCX failed: Agent not found",
          };
      }

      const templatePath = path.resolve("public", "ai4all.docx");
      if (!fs.existsSync(templatePath)) {
          return {
              success: false,
              msg: "Template file not found",
          };
      }

      const originFile = fs.readFileSync(templatePath, 'binary');
      const zip = new PizZip(originFile);
      
     
      const doc = new Docxtemplater(zip, {
        modules:
        []
      });

      // const ictCodes = Array.isArray(agent.course)
      //       ? agent.course.map((item:any) => ({
      //             title: item.title || "N/A",
      //             answer: item.answer || "N/A",
      //         }))
      //       : [{ title: "N/A", answer: "N/A" }];

      // console.log(ictCodes)
      doc.render({ test:"zainy wow" });

      // doc.render();

      return {
          buffer: doc.getZip().generate({ type: 'nodebuffer' }),
          response: true,
      };
  } catch (error) {
      console.error("Error generating DOCX:", error);
      return {
          response: false,
          msg: "An error occurred while generating the DOCX file",
      };
  }
}


public async agentCourse(agentId){
      try{
        const agent = await this.AgentService.findOne(agentId)
        if(agent==null){
          return null
        }
        return agent
      }catch(e){
        return null
      }
}

}


