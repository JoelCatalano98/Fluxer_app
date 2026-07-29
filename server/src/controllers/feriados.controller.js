const getFeriados = async (req, res) => {
    try {
        // Devolvemos un array vacío para evitar el error 404 en el frontend
        // Si más adelante se crea un modelo Feriados, se puede reemplazar esto
        return res.status(200).json({
            success: true,
            data: [],
            message: 'Feriados obtenidos correctamente'
        });
    } catch (error) {
        console.error('Error al obtener feriados:', error);
        return res.status(500).json({
            success: false,
            data: [],
            message: 'Error interno del servidor'
        });
    }
};

module.exports = {
    getFeriados
};
