import React, {useEffect,useContext,useState} from 'react';
import {useRouter} from 'next/router';
import {firebaseContext, FirebaseContext} from '../../firebase';
import Error404 from "../../components/layout/404";
import Layout from '../../components/layout/Layout';
import {css} from '@emotion/core';
import styled from '@emotion/styled';
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import { es } from "date-fns/locale";
import {Campo, InputSubmit} from '../../components/ui/Formulario';
import Boton from '../../components/ui/Boton';

const ContenedorProducto = styled.div`
    @media (min-width: 768px){
        display: grid;
        grid-template-columns: 2fr 1fr;
        column-gap: 2rem;
    }
`

const CreadorProducto = styled.p`
  padding: .5rem 2rem;
  background-color: #DA552F;
  color: #fff;
  text-transform: uppercase;
  font-weight: bold;
  display: inline-block;
  text-align:center;

`;

const Producto = () => {
    
    //state del componente
    const [producto,guardarProducto] = useState({});
    const [error, guardarError] = useState(false);
    const [comentario,guardarComentario] = useState({});
    const [consultarDB, guardarConsultarDB] = useState(true);


    //Routing para obtener el id actual
    const router = useRouter();
    const {query: {id}} = router;
    
    //context de firebase
    const {firebase,usuario} = useContext(FirebaseContext);
    useEffect(()=>{
        if(id && consultarDB){
            const obtenerProducto = async () => {
                const productoQuery = await firebase.db.collection('productos').doc(id);
                const producto = await productoQuery.get();
               
                if(producto.exists){
                     guardarProducto(producto.data());
                     guardarConsultarDB(false);
                }else{
                    guardarError(true);
                    guardarConsultarDB(false);
                }
            }
            obtenerProducto();
        }
    }, [id,producto]);
    
    if(Object.keys(producto).length === 0 &&!error ) return 'Cargando...';
    const {
      
      comentarios,
      creado,
      descripcion,
      empresa,
      nombre,
      url,
      urlimagen,
      votos,
      creador,
      haVotado
    } = producto;
    //adminsitrar y validar los votos
    const votarProducto = () =>{
      if(!usuario){
        return router.push('/login');
      }
      //Obtener y sumar un nuevo voto
      const nuevoTotal = votos + 1;
      //verificar si usuario ha votado
      if(haVotado.includes(usuario.uid)) return;

      //guardar el ID del usuario que ha votado
      const nuevoHaVotado = [...haVotado,usuario.uid];
      //Actualizar en la BD
      firebase.db
        .collection("productos")
        .doc(id)
        .update({ votos: nuevoTotal, haVotado: nuevoHaVotado });
      //Actualizar el state
      guardarProducto({
          ...producto,votos: nuevoTotal
      })
       guardarConsultarDB(true); //hay un voto y consultar la BD

    }

    //funciones para crear comentarios
    const comentarioChange = e =>{
      guardarComentario({
        ...comentario,
        [e.target.name] : e.target.value
      })
    }
    //identifica si el comentario es del autor
    const esCreador = id =>{
      if(creador.id === id){
        return true;
      }
    }

    const agregarComentario = e =>{
      e.preventDefault();
       if (!usuario) {
         return router.push("/login");
       }
       //informacion extra al comentario
       comentario.usuarioId = usuario.uid;
       comentario.usuarioNombre = usuario.displayName;

       // tomar copia de comentarios ya gregar al arreglo
       const nuevosComentarios = [...comentarios,comentario];


       //actulizar BD
       firebase.db.collection("productos").doc(id).update({
         comentarios: nuevosComentarios
       })

       //actualizar state
       guardarProducto({
         ...producto,
         comentarios: nuevosComentarios
       })
        guardarConsultarDB(true); //Pasa a true porque hay un comentario
    }
    //funcion que revisa que el creador del producto sea el mismo que el autenticado
    const puedeBorar = () =>{
      if(!usuario) return false;
      if(creador.id === usuario.uid){
        return true
      }
    }

    //eliminar un producto de la bd
    const eliminarProducto = async () =>{
       if (!usuario) {
         return router.push("/login");
       }
       if (creador.id !== usuario.uid) {
         return router.push("/");
       }
     
      try {
        await firebase.db.collection('productos').doc(id).delete();
        router.push('/');
      } catch (error) { 
        console.log(error);
      }
    }

    return (
      <Layout>
        <>
          {error ? (
            <Error404 />
          ) : (
            <div className="contenedor">
              <h1
                css={css`
                  text-align: center;
                  margin-top: 5rem;
                `}
              >
                {nombre}{" "}
              </h1>
              <ContenedorProducto>
                <div>
                  <p>
                    Publicado hace:{" "}
                    {formatDistanceToNow(new Date(creado), { locale: es })}{" "}
                  </p>
                  <p>
                    Por {creador.nombre} de {empresa}{" "}
                  </p>
                  <img src={urlimagen} />
                  <p>{descripcion}</p>

                  {usuario && (
                    <>
                      <h2>Agrega tu comentario</h2>
                      <form onSubmit={agregarComentario}>
                        <Campo>
                          <input
                            type="text"
                            name="mensaje"
                            onChange={comentarioChange}
                          />
                        </Campo>
                        <InputSubmit type="submit" value="Agregar comentario" />
                      </form>
                    </>
                  )}

                  <h2
                    css={css`
                      margin: 2rem 0;
                    `}
                  >
                    Comentarios
                  </h2>
                  {comentarios.length === 0 ? (
                    "Aun no hay comentarios"
                  ) : (
                    <ul>
                      {comentarios.map((comentario, i) => (
                        <li
                          key={`${comentario.usuarioId}-${i}`}
                          css={css`
                            border: 1px solid #e1e1e1;
                            padding: 2rem;
                          `}
                        >
                          <span
                            css={css`
                              font-weight: bold;
                            `}
                          >
                            <p>{comentario.mensaje}</p>
                          </span>
                          {""} <p>Escrito por: {comentario.usuarioNombre}</p>
                          {esCreador(comentario.usuarioId) && (
                            <CreadorProducto>Es Creador</CreadorProducto>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <aside>
                  <Boton target="_blank" bgColor="true" href={url}>
                    Visitar URL
                  </Boton>

                  {usuario && (
                    <>
                      <Boton onClick={votarProducto}>Votar</Boton>
                    </>
                  )}
                  <div
                    css={css`
                      margin-top: 5rem;
                    `}
                  >
                    <p
                      css={css`
                        text-align: center;
                      `}
                    >
                      {votos} Votos
                    </p>
                  </div>
                </aside>
              </ContenedorProducto>
              {puedeBorar() && 
              <Boton
                onClick={eliminarProducto}
              
              >Eliminar Producto</Boton>
              }
            </div>
          )}
        </>
      </Layout>
    );
}
 
export default Producto;