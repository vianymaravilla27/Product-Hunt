import React, { useState } from "react";
import styled from "@emotion/styled";
import { css } from "@emotion/core";
import Layout from "../components/layout/Layout";
import {
  Formulario,
  Campo,
  InputSubmit,
  Error,
} from "../components/ui/Formulario";
import Router from "next/router";
import firebase from "../firebase";

//validaciones

import useValidacion from "../hooks/useValidacion";
import validarIniciarSesion from "../validacion/validarIniciarSesion";

const STATE_INICIAL = {
  email: "",
  password: "",
};

const Login = () =>  {
  const [error, guardarError] = useState(false);
  const {
    valores,
    errores,
    handleSubmit,
    handleChange,
    handleBlur,
  } = useValidacion(STATE_INICIAL, validarIniciarSesion, iniciarSesion);

  const {  email, password } = valores;

  async function iniciarSesion(){
    try {
      const usuario = await firebase.login(email,password);
     
      Router.push('/');
    } catch (error) {
      console.error("Hubo un error al autenticar el usuario", error.message);
      guardarError(error.message);
    } 
  }

  return (
    <div>
      <Layout>
        <>
          <h1
            css={css`
              text-align: center;
              margin-top: 5rem;
            `}
          >
           Iniciar Sesion
          </h1>
          <Formulario onSubmit={handleSubmit} noValidate>
           
            <Campo>
              <label htmlFor="nombre">Email</label>
              <input
                type="text"
                id="email"
                placeholder="Tu email"
                name="email"
                value={email}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </Campo>
            {errores.email && <Error>{errores.email} </Error>}
            <Campo>
              <label htmlFor="nombre">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Tu Password"
                name="password"
                value={password}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </Campo>
            {errores.password && <Error>{errores.password} </Error>}

            {error && <Error>{error}</Error>}
            <InputSubmit type="submit" value="Iniciar Sesión" />
          </Formulario>
        </>
      </Layout>
    </div>
  );
};

export default Login;
