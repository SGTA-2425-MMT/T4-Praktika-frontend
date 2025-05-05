¿Cómo debería funcionar una ciudad?
🔹 1. Creación de la ciudad
Ocurre cuando un Settler la funda.

El Settler desaparece y se genera la ciudad en esa casilla.

Se le da un nombre (automático o editable).

Se muestra una animación breve o icono de ciudad en el mapa.

🔹 2. Interacción con la ciudad (clic del jugador)
Cuando el jugador hace clic en la ciudad, se abre una interfaz flotante o lateral con:

📋 Información general
Nombre de la ciudad.

Población (por ejemplo: "Población: 1").

Recursos producidos por turno: comida, producción, oro.

Estado de felicidad o crecimiento (opcional, si lo implementas).

🏗️ Producción
Se muestra lo que está construyendo la ciudad (ej: “Entrenando Warrior (3 turnos restantes)”).

Lista de opciones para construir:

Unidades (Warrior, Archer, etc.).

Edificios básicos (opcional para más adelante).

Al elegir una opción, se reemplaza o añade a la cola de producción.

🌾 Gestión del terreno (opcional o visual)
Muestra las casillas de alrededor que la ciudad está usando.

Podrías representar esto visualmente con un borde o resaltado.

🔹 3. Ciclo por turno (función automática)
Cada turno, la ciudad:

Consume comida según población.

Produce recursos según las casillas que controla.

Progreso de producción: avanza 1 turno en el entrenamiento de unidad.

Si la comida acumulada es suficiente, la población crece.

Si la producción termina, se crea la unidad y aparece junto a la ciudad.

🔹 4. Crecimiento
A medida que acumula comida suficiente, sube su población.

Con más población:

Puede trabajar más casillas.

Produce más recursos.

Puedes limitar la expansión a un radio de 1 casilla al principio.

🔹 5. Defensa
Las ciudades pueden ser atacadas.

Si no hay unidades dentro, son vulnerables.

Puedes agregar una pequeña defensa base o permitir que unidades se fortifiquen dentro.

🧭 Flujo básico de uso
Fundas la ciudad → aparece en el mapa.

Haces clic → se abre la interfaz.

Seleccionas qué construir → comienza la producción.

Cada turno avanza producción y puede crecer.

Cuando terminas una unidad → aparece en el mapa.

Puedes repetir el ciclo o cambiar producción cuando quieras.