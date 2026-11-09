import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Alert } from '../../components/alert/alert';
import { Icon } from '../../components/icon/icon';
import { PageHeader } from '../../components/page-header/page-header';
import { AuthService, INICIO_POR_ROL } from '../../services/auth.service';
import { MOCK_USUARIOS } from '../../services/mock-data';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-acceder-page',
  imports: [ReactiveFormsModule, PageHeader, Alert, Icon],
  templateUrl: './acceder.html',
  styleUrl: './acceder.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccederPage {
  /** Ruta a la que volver tras iniciar sesión (query param `volver`). */
  readonly volver = input<string>();

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Accesos de demostración: solo con datos de ejemplo. */
  protected readonly demo = environment.useMocks ? MOCK_USUARIOS : [];
  protected readonly etiquetaRol = { cliente: 'Cliente', barista: 'Barista', admin: 'Admin' };

  protected enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: (s) => this.router.navigateByUrl(this.volver() || INICIO_POR_ROL[s.usuario.rol]),
      error: (e: Error) => {
        this.error.set(e.message || 'No se ha podido iniciar sesión.');
        this.enviando.set(false);
      },
    });
  }

  protected rellenar(email: string, password: string): void {
    this.form.setValue({ email, password });
    this.enviar();
  }
}
