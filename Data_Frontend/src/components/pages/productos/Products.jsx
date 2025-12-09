import React from 'react'
import DashboardSensores from '../../secciones/dashboardSensores/DashboardSensores'
import SonidoPromedio from '../../secciones/dashboardSensores/sonido/SonidoPromedio'
import NiveldeSonido from '../../secciones/dashboardSensores/sonidoPromedio/NiveldeSonido'
import Distribucion from '../../secciones/dashboardSensores/sonidoDistribucion/Distribucion'


function Products() {
  return (
    <>
      <DashboardSensores mode="charts" />
      <h1>sonido</h1>
      <SonidoPromedio />
      <NiveldeSonido/>
      <Distribucion/>
    </>
  )
}

export default Products
