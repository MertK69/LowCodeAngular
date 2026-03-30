import { Component, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { StateService } from '../../core/services/state.service';
import { ApplicationService } from '../../core/services/application.service';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';

@Component({
  selector: 'app-kundenportal',
  standalone: true,
  imports: [FormsModule, NgClass, CurrencyPipe, DatePipe],
  templateUrl: './kundenportal.html',
  styleUrl: './kundenportal.css',
})
export class Kundenportal {
  protected readonly state = inject(StateService);
  protected readonly appService = inject(ApplicationService);

  @ViewChild('sigCanvas') set sigCanvas(content: ElementRef<HTMLCanvasElement>) {
    if (content) {
      this._sigCanvas = content;
      this.initCanvas();
    }
  }
  private _sigCanvas?: ElementRef<HTMLCanvasElement>;
  private ctx?: CanvasRenderingContext2D;
  private isDrawing = false;
  protected hasSignature = false;

  private initCanvas() {
    if (this._sigCanvas) {
      const canvas = this._sigCanvas.nativeElement;
      this.ctx = canvas.getContext('2d')!;
      this.ctx.strokeStyle = '#1e293b';
      this.ctx.lineWidth = 2;
      this.ctx.lineCap = 'round';
      
      // Sync internal resolution with display size
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
  }

  startDrawing(event: MouseEvent | TouchEvent) {
    this.isDrawing = true;
    if (!this.ctx) this.initCanvas();
    this.draw(event);
  }

  stopDrawing() {
    this.isDrawing = false;
    if (this.ctx) {
      this.ctx.beginPath();
    }
  }

  draw(event: MouseEvent | TouchEvent) {
    if (!this.isDrawing || !this.ctx || !this._sigCanvas) return;
    
    const canvas = this._sigCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    
    let x, y;
    if (event instanceof MouseEvent) {
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    } else {
      const touch = event.touches[0];
      x = touch.clientX - rect.left;
      y = touch.clientY - rect.top;
      // Prevent scrolling while signing
      event.preventDefault();
    }

    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.hasSignature = true;
  }

  clearSignature() {
    if (this.ctx && this._sigCanvas) {
      const canvas = this._sigCanvas.nativeElement;
      this.ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.hasSignature = false;
    }
  }

  async onSign() {
    const record = this.state.customerRecord();
    if (record) {
      await this.state.runAction(record.id, 'customer_sign');
      this.hasSignature = false;
    }
  }

  async onSubmit() {
    const validation = this.appService.validateDraft(this.state.customerDraft());
    if (!validation.valid || validation.hardBlock) {
      alert(validation.message);
      return;
    }
    try {
      await this.state.submitApplication(this.state.customerDraft());
    } catch (e) {
      alert('Antrag konnte nicht gesendet werden.');
    }
  }

  onReset() {
    this.state.resetDraft();
  }

  updateDraft(key: string, value: any) {
    this.state.customerDraft.update(d => ({ ...d, [key]: value }));
  }

  protected hasActiveApplication(): boolean {
    const record = this.state.customerRecord();
    if (!record) return false;
    return !['Abgeschlossen', 'Abgelehnt'].includes(record.overallStatus);
  }
}
