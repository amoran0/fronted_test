import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Aviso } from '../../componentes/aviso/aviso';
import { Icono } from '../../componentes/icono/icono';
import { CabeceraPagina } from '../../componentes/cabecera-pagina/cabecera-pagina';
import { EtiquetaEstado } from '../../componentes/etiqueta-estado/etiqueta-estado';
import { ALERGENOS, Alergeno, EstadoProducto, Producto } from '../../modelos/producto';
import { ServicioProductos } from '../../servicios/servicio-productos';
import { PipeEuro } from '../../utilidades/pipe-euro';
import { textoAIdentificador } from '../../utilidades/formato';

@Component({
  selector: 'app-pagina-editar-producto',
  imports: [ReactiveFormsModule, CabeceraPagina, Aviso, Icono, EtiquetaEstado, PipeEuro, RouterLink],
  templateUrl: './editar-producto.html',
  styleUrl: './editar-producto.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaEditarProducto {
  /** `:id` de la ruta, o `nuevo` para crear. */
  readonly id = input.required<string>();

  protected readonly servicioProductos = inject(ServicioProductos);
  private readonly enrutador = inject(Router);

  protected readonly todosAlergenos = ALERGENOS;
  protected readonly esNuevo = computed(() => this.id() === 'nuevo');
  protected readonly producto = computed(() => this.servicioProductos.porId(this.id()));
  protected readonly pidiendoConfirmacionRetirada = signal(false);
  protected readonly cambiosGuardados = signal(false);
  protected readonly desplegableAlergenosAbierto = signal(false);

  protected readonly formulario = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(60)]],
    categoriaId: ['cafe', Validators.required],
    precio: [0, [Validators.required, Validators.min(0.1), Validators.max(99)]],
    estado: ['disponible' as EstadoProducto, Validators.required],
    alergenos: [[] as Alergeno[]],
    descripcion: ['', Validators.maxLength(280)],
  });

  constructor() {
    // Rellena el formulario cuando llega el producto (los datos se cargan de forma asíncrona).
    effect(() => {
      const productoCargado = this.producto();
      if (productoCargado && !this.formulario.dirty) {
        this.formulario.reset({
          nombre: productoCargado.nombre,
          categoriaId: productoCargado.categoriaId,
          precio: productoCargado.precio,
          estado: productoCargado.estado,
          alergenos: [...productoCargado.alergenos],
          descripcion: productoCargado.descripcion,
        });
      }
    });
  }

  protected tieneAlergeno(alergeno: Alergeno): boolean {
    return this.formulario.controls.alergenos.value.includes(alergeno);
  }

  /** Añade el alérgeno si no estaba marcado, o lo quita si ya lo estaba. */
  protected alternarAlergeno(alergeno: Alergeno): void {
    const controlAlergenos = this.formulario.controls.alergenos;
    controlAlergenos.setValue(
      this.tieneAlergeno(alergeno)
        ? controlAlergenos.value.filter((alergenoMarcado) => alergenoMarcado !== alergeno)
        : [...controlAlergenos.value, alergeno],
    );
    controlAlergenos.markAsDirty();
  }

  /** Cierra el desplegable de alérgenos cuando el foco sale de él. */
  protected cerrarDesplegableAlergenos(evento: FocusEvent): void {
    const contenedor = evento.currentTarget as HTMLElement;
    if (!contenedor.contains(evento.relatedTarget as Node | null)) this.desplegableAlergenosAbierto.set(false);
  }

  protected guardarProducto(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const valores = this.formulario.getRawValue();
    const id = this.esNuevo() ? textoAIdentificador(valores.nombre) : this.id();
    const productoAnterior: Partial<Producto> = this.producto() ?? {};
    const precioRedondeado = Math.round(valores.precio * 100) / 100;
    const productoGuardado = { ...productoAnterior, ...valores, id, precio: precioRedondeado } as Producto;
    this.servicioProductos.guardar(productoGuardado).subscribe(() => {
      this.cambiosGuardados.set(true);
      this.formulario.markAsPristine();
      if (this.esNuevo()) this.enrutador.navigate(['/admin/carta', id]);
    });
  }

  protected retirarProducto(): void {
    this.servicioProductos.retirar(this.id()).subscribe(() => this.enrutador.navigateByUrl('/admin/carta'));
  }

  protected reactivarEnCarta(): void {
    this.servicioProductos.cambiarEstado([this.id()], 'disponible', 'En servicio').subscribe();
  }

  protected campoInvalido(nombreCampo: keyof typeof this.formulario.controls): boolean {
    const control = this.formulario.controls[nombreCampo];
    return control.touched && control.invalid;
  }
}
