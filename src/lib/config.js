/** A module to manage the application configuration.
 * @module lib/Config
 */

export default {
    /** Ask for this number of tasks and projects per page (default: 20 in gitlab) */
    PROJECTS_PER_PAGE: 40,
    /** Name of the assigned_to_me parameter.
     *  If gitlab < 11, use "assigned-to-me". Else, use "assigned_to_me".
     */
    ASSIGNED_TO_ME: 'assigned-to-me'
}